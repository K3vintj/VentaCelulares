-- Additive migration: keep the existing business tables, IDs, photos and RLS.
-- Only the server-side service_role may call this API. No browser grants.
create table if not exists public."StoreAdminAuth" (
  "adminId" text primary key references public."AdminUser"(id),
  "authUserId" uuid not null unique references auth.users(id),
  enabled boolean not null default false,
  "createdAt" timestamptz not null default now()
);
create table if not exists public."StoreRateLimit" (
  key text primary key, count integer not null, "expiresAt" timestamptz not null
);
alter table public."StoreAdminAuth" enable row level security;
alter table public."StoreRateLimit" enable row level security;
revoke all on public."StoreAdminAuth", public."StoreRateLimit" from public, anon, authenticated;
grant select, insert, update, delete on public."StoreAdminAuth", public."StoreRateLimit",
  public."AdminUser", public."AdminSession", public."Product", public."ProductPhoto",
  public."Order", public."Sale", public."Delivery", public."BusinessConfig", public."AuditLog" to service_role;

create or replace function public.vc_store_assert(ok boolean, status integer, message text)
returns void language plpgsql security invoker set search_path = pg_catalog, public as $$
begin
  if ok is not true then raise exception '%', message using errcode = 'P0001', detail = status::text; end if;
end $$;

create or replace function public.vc_store_audit(actor text, action text, entity text, identifier text, details jsonb default '{}')
returns void language sql security invoker set search_path = pg_catalog, public as $$
  insert into public."AuditLog" (id,"adminId",action,"entityType","entityId",details,"createdAt")
  values (gen_random_uuid()::text,actor,action,entity,identifier,details,now());
$$;

create or replace function public.vc_store_folio()
returns text language sql volatile security invoker set search_path = pg_catalog, public as $$
  select 'VC-' || to_char(now() at time zone 'America/Mexico_City','YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
$$;

create or replace function public.vc_store_product(p public."Product", private boolean default false)
returns jsonb language sql stable security invoker set search_path = pg_catalog, public as $$
  select to_jsonb(p) || jsonb_build_object('photos',coalesce((select jsonb_agg(to_jsonb(f) order by f."sortOrder",f.id) from public."ProductPhoto" f where f."productId"=p.id),'[]'::jsonb))
    || case when private then jsonb_build_object('linkedOrder',(
      select jsonb_build_object('id',o.id,'folio',o.folio,'customerName',o."customerName",'customerPhone',o."customerPhone",'status',o.status)
      from public."Order" o where o."productId"=p.id and o.status in ('confirmada','completada')
      order by (o.status='confirmada') desc,o."createdAt" desc limit 1)) else '{}'::jsonb end;
$$;

create or replace function public.vc_store_order(o public."Order")
returns jsonb language sql stable security invoker set search_path = pg_catalog, public as $$
  select to_jsonb(o) || jsonb_build_object(
    'product',(select to_jsonb(p) from public."Product" p where p.id=o."productId"),
    'sale',(select to_jsonb(s) from public."Sale" s where s."orderId"=o.id),
    'delivery',(select to_jsonb(d) from public."Delivery" d where d."orderId"=o.id));
$$;

create or replace function public.vc_store_order_matches(o public."Order", a jsonb)
returns boolean language sql stable security invoker set search_path = pg_catalog, public as $$
  select
    (coalesce(a->>'productId','')='' or o."productId"=a->>'productId')
    and (coalesce(a->>'status','all')='all' or o.status::text=a->>'status' or (a->>'status'='sold' and exists(select 1 from public."Sale" s where s."orderId"=o.id)))
    and (coalesce(a->>'q','')='' or strpos(lower(concat_ws(' ',o.folio,o."customerName",o."customerPhone",o."productNameSnapshot")),lower(a->>'q'))>0)
    and (coalesce(a->>'from','')='' or o."createdAt">=((a->>'from')::date::timestamp at time zone 'America/Mexico_City'))
    and (coalesce(a->>'to','')='' or o."createdAt"<(((a->>'to')::date+1)::timestamp at time zone 'America/Mexico_City'))
    and (coalesce(a->>'deliveryStatus','all')='all' or (o.status<>'cancelada' and (
      (a->>'deliveryStatus'='unscheduled' and not exists(select 1 from public."Delivery" d where d."orderId"=o.id))
      or exists(select 1 from public."Delivery" d where d."orderId"=o.id and d.status::text=a->>'deliveryStatus'))));
$$;

create or replace function public.vc_store_rate(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security invoker set search_path = pg_catalog, public as $$
declare n integer;
begin
  delete from public."StoreRateLimit" where "expiresAt"<now();
  perform public.vc_store_assert(length(p_key)<=100 and p_limit between 1 and 100 and p_seconds between 1 and 86400,400,'Límite inválido');
  if (select count(*) from public."StoreRateLimit")>10000 then return false; end if;
  insert into public."StoreRateLimit"(key,count,"expiresAt") values(p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict(key) do update set count=public."StoreRateLimit".count+1 returning count into n;
  return n<=p_limit;
end $$;

create or replace function public.vc_store_call(operation text, a jsonb default '{}', actor text default null)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
#variable_conflict use_column
declare
  p public."Product"; d public."Product"; o public."Order"; existing public."Order";
  s public."Sale"; delivery public."Delivery"; photo public."ProductPhoto";
  administrator public."AdminUser"; config public."BusinessConfig";
  data jsonb; items jsonb; identifier text; target text; item text; index integer;
  total integer; pages integer; page integer; page_size integer; n integer;
begin
  -- The gateway cannot delegate an administrator supplied in a request body.
  -- The Edge Function derives actor from a verified Auth JWT + registered session.
  if operation like 'admin.%' then
    perform public.vc_store_assert(actor is not null and exists(select 1 from public."AdminUser" where id=actor),401,'Inicia sesión para continuar');
  end if;

  if operation='auth.open' then
    select u.* into administrator from public."AdminUser" u join public."StoreAdminAuth" m on m."adminId"=u.id
      where m."authUserId"=(a->>'userId')::uuid and m.enabled;
    perform public.vc_store_assert(found,401,'Credenciales incorrectas');
    insert into public."AdminSession"(id,"adminId","tokenHash","createdAt","expiresAt")
      values(gen_random_uuid()::text,administrator.id,a->>'sessionHash',now(),now()+interval '1 hour')
      on conflict("tokenHash") do nothing;
    return jsonb_build_object('admin',jsonb_build_object('id',administrator.id,'name',administrator.name,'email',administrator.email));
  elsif operation='auth.me' then
    select u.* into administrator from public."AdminSession" s join public."AdminUser" u on u.id=s."adminId"
      join public."StoreAdminAuth" m on m."adminId"=u.id where s."tokenHash"=a->>'sessionHash' and s."expiresAt">now()
      and m."authUserId"=(a->>'userId')::uuid and m.enabled;
    perform public.vc_store_assert(found,401,'Sesión inválida o expirada');
    return jsonb_build_object('admin',jsonb_build_object('id',administrator.id,'name',administrator.name,'email',administrator.email));
  elsif operation='admin.auth.close' then
    delete from public."AdminSession" where "adminId"=actor and "tokenHash"=a->>'sessionHash';
    return '{"ok":true}'::jsonb;
  elsif operation='admin.auth.password' then
    delete from public."AdminSession" where "adminId"=actor;
    perform public.vc_store_audit(actor,'change_password','AdminUser',actor);
    return '{"ok":true}'::jsonb;
  elsif operation in ('public.config','public.ready') then
    select * into config from public."BusinessConfig" where id='default';
    perform public.vc_store_assert(found,503,'La configuración del negocio está pendiente');
    if operation='public.ready' then return '{"ok":true,"database":true}'::jsonb; end if;
    return jsonb_build_object('config',to_jsonb(config));
  elsif operation in ('public.products','public.product','admin.products','admin.product') then
    if operation in ('public.product','admin.product') then
      select * into p from public."Product" where (id=a->>'id' or sku=a->>'id') and not "isArchived"
        and (operation='admin.product' or "isPublished");
      perform public.vc_store_assert(found,404,'Equipo no encontrado');
      return jsonb_build_object('product',public.vc_store_product(p,operation='admin.product'));
    end if;
    page_size:=case when operation='admin.products' then 100000 else least(500,greatest(1,coalesce((a->>'limit')::int,500))) end;
    page:=greatest(1,coalesce((a->>'page')::int,1));
    select count(*) into total from public."Product" q where not q."isArchived" and (operation='admin.products' or q."isPublished")
      and (coalesce(a->>'q','')='' or strpos(lower(concat_ws(' ',q.sku,q.name)),lower(a->>'q'))>0);
    select coalesce(jsonb_agg(public.vc_store_product(t,operation='admin.products') order by t."createdAt" desc,t.id),'[]') into items
      from (select q.* from public."Product" q where not q."isArchived" and (operation='admin.products' or q."isPublished")
        and (coalesce(a->>'q','')='' or strpos(lower(concat_ws(' ',q.sku,q.name)),lower(a->>'q'))>0)
        order by q."createdAt" desc,q.id limit page_size offset (page-1)*page_size) t;
    return jsonb_build_object('products',items,'total',total);
  elsif operation in ('admin.product.create','admin.product.update') then
    d:=jsonb_populate_record(null::public."Product",a->'product');
    if operation='admin.product.update' then
      select * into p from public."Product" where id=a->>'id' or sku=a->>'id' for no key update;
      perform public.vc_store_assert(found and not p."isArchived",404,'Equipo no encontrado');
      perform public.vc_store_assert(d.sku=p.sku,400,'El código de una unidad existente no se puede cambiar');
      if not (a->'product' ? 'referenceVariantId') then d."referenceVariantId":=p."referenceVariantId"; end if;
    else
      p.id:=gen_random_uuid()::text; p.status:='Disponible'; p."isArchived":=false; p."createdAt":=now();
      perform public.vc_store_assert(not exists(select 1 from public."Product" where sku=d.sku),409,'El código ya existe');
    end if;
    perform public.vc_store_assert(not d."isPublished" or (d."verifiedNotRefurbished" and d."verifiedNoReplacedParts" and d."techInfoVerified"),400,'Completa las verificaciones antes de publicar');
    perform public.vc_store_assert(not d."isPublished" or d."referenceVariantId" is not null or exists(select 1 from public."ProductPhoto" where "productId"=p.id),400,'Selecciona una imagen de biblioteca o agrega fotos antes de publicar');
    insert into public."Product"(id,sku,name,storage,color,"referenceVariantId",battery,price,status,condition,"conditionNote","warrantyDays","physicalCondition","screenCondition","cameraStatus",biometric,"unlockStatus","repairHistory",accessories,observations,description,"verifiedNotRefurbished","verifiedNoReplacedParts","techInfoVerified","isPublished","isArchived","createdAt","updatedAt")
      values(p.id,d.sku,d.name,d.storage,d.color,d."referenceVariantId",d.battery,d.price,p.status,d.condition,d."conditionNote",d."warrantyDays",d."physicalCondition",d."screenCondition",d."cameraStatus",d.biometric,d."unlockStatus",d."repairHistory",d.accessories,d.observations,d.description,d."verifiedNotRefurbished",d."verifiedNoReplacedParts",d."techInfoVerified",d."isPublished",p."isArchived",p."createdAt",now())
      on conflict(id) do update set name=excluded.name,storage=excluded.storage,color=excluded.color,"referenceVariantId"=excluded."referenceVariantId",battery=excluded.battery,price=excluded.price,condition=excluded.condition,"conditionNote"=excluded."conditionNote","warrantyDays"=excluded."warrantyDays","physicalCondition"=excluded."physicalCondition","screenCondition"=excluded."screenCondition","cameraStatus"=excluded."cameraStatus",biometric=excluded.biometric,"unlockStatus"=excluded."unlockStatus","repairHistory"=excluded."repairHistory",accessories=excluded.accessories,observations=excluded.observations,description=excluded.description,"verifiedNotRefurbished"=excluded."verifiedNotRefurbished","verifiedNoReplacedParts"=excluded."verifiedNoReplacedParts","techInfoVerified"=excluded."techInfoVerified","isPublished"=excluded."isPublished","updatedAt"=now() returning * into p;
    perform public.vc_store_audit(actor,case when operation='admin.product.create' then 'create' else 'update' end,'Product',p.id);
    return jsonb_build_object('product',public.vc_store_product(p,true));
  elsif operation in ('admin.product.archive','admin.product.release','admin.photo.add','admin.photo.remove','admin.photo.reorder') then
    select * into p from public."Product" where id=a->>'id' or sku=a->>'id' for no key update;
    perform public.vc_store_assert(found and not p."isArchived",404,'Equipo no encontrado');
    if operation='admin.product.archive' then
      perform public.vc_store_assert(p.status<>'Reservado',409,'Libera o resuelve la reserva antes de archivar');
      update public."Product" set "isPublished"=false,"isArchived"=true,"updatedAt"=now() where id=p.id;
      perform public.vc_store_audit(actor,'archive','Product',p.id);
    elsif operation='admin.product.release' then
      perform public.vc_store_assert(a->>'status'='Disponible',400,'Usa Reservar equipo o Registrar venta para cambiar este estado');
      perform public.vc_store_assert(p.status::text=a->>'expectedStatus' and p.status='Reservado',409,'La disponibilidad cambió. Actualiza el inventario');
      perform public.vc_store_assert(not exists(select 1 from public."Order" where "productId"=p.id and status='confirmada'),409,'Cancela primero el pedido confirmado');
      update public."Product" set status='Disponible',"updatedAt"=now() where id=p.id returning * into p;
      perform public.vc_store_audit(actor,'status','Product',p.id,'{"from":"Reservado","to":"Disponible"}');
      return jsonb_build_object('product',public.vc_store_product(p,true));
    elsif operation='admin.photo.add' then
      perform public.vc_store_assert((select count(*) from public."ProductPhoto" where "productId"=p.id)<12,400,'Máximo 12 fotografías por equipo');
      insert into public."ProductPhoto"(id,"productId",url,"storageKey","sortOrder","createdAt")
        select gen_random_uuid()::text,p.id,a->>'url',a->>'storageKey',coalesce(max("sortOrder"),-1)+1,now() from public."ProductPhoto" where "productId"=p.id returning * into photo;
      perform public.vc_store_audit(actor,'upload_photo','Product',p.id,jsonb_build_object('photoId',photo.id));
      return jsonb_build_object('photo',to_jsonb(photo));
    elsif operation='admin.photo.remove' then
      select * into photo from public."ProductPhoto" where id=a->>'photoId' and "productId"=p.id;
      perform public.vc_store_assert(found,404,'Fotografía no encontrada');
      perform public.vc_store_assert(not p."isPublished" or p."referenceVariantId" is not null or (select count(*) from public."ProductPhoto" where "productId"=p.id)>1,409,'Oculta el producto o selecciona una imagen antes de eliminar su última foto');
      delete from public."ProductPhoto" where id=photo.id;
      perform public.vc_store_audit(actor,'delete_photo','Product',p.id,jsonb_build_object('photoId',photo.id));
      return jsonb_build_object('storageKey',photo."storageKey");
    else
      select count(*) into n from public."ProductPhoto" where "productId"=p.id;
      perform public.vc_store_assert(n=jsonb_array_length(a->'photoIds') and n=(select count(distinct x) from jsonb_array_elements_text(a->'photoIds') x)
        and not exists(select 1 from public."ProductPhoto" where "productId"=p.id and not (a->'photoIds' ? id)),400,'La lista debe contener todas las fotografías sin duplicados');
      index:=0;
      for item in select jsonb_array_elements_text(a->'photoIds') loop
        update public."ProductPhoto" set "sortOrder"=index where id=item and "productId"=p.id; index:=index+1;
      end loop;
      perform public.vc_store_audit(actor,'reorder_photos','Product',p.id);
    end if;
    return '{"ok":true}'::jsonb;
  elsif operation in ('public.order.create','admin.reserve') then
    select * into p from public."Product" where id=a->>'productId' or sku=a->>'productId' for no key update;
    perform public.vc_store_assert(found and not p."isArchived",404,'Equipo no encontrado');
    if operation='admin.reserve' and a ? 'orderId' then
      select * into o from public."Order" where id=a->>'orderId' for no key update;
      perform public.vc_store_assert(found and o."productId"=p.id,409,'El pedido no corresponde a este equipo');
      if o.status='confirmada' and p.status='Reservado' then return jsonb_build_object('order',public.vc_store_order(o)); end if;
      perform public.vc_store_assert(o.status='pendiente',409,'Este pedido ya está cerrado o confirmado');
    else
      select * into existing from public."Order" where "requestKey"=a->>'requestKey';
      if found then
        perform public.vc_store_assert(existing."productId"=p.id and existing."customerName"=a->>'customerName' and existing."customerPhone"=a->>'customerPhone' and existing."deliveryMode"::text=a->>'deliveryMode'
          and coalesce(existing."shippingDestination",'')=case when a->>'deliveryMode'='envio' then a->>'shippingDestination' else '' end,409,'La clave de solicitud ya se usó con otros datos');
        return jsonb_build_object('order',case when operation='public.order.create' then to_jsonb(existing)-'requestKey'-'consentAccepted' else public.vc_store_order(existing) end);
      end if;
    end if;
    if operation='public.order.create' then
      perform public.vc_store_assert(p."isPublished" and p.status='Disponible',409,'El equipo ya no está disponible. Consulta el catálogo');
    else
      perform public.vc_store_assert(p.status::text=a->>'expectedStatus' and p.status<>'Vendido',409,'La disponibilidad cambió. Actualiza el inventario');
      perform public.vc_store_assert(not exists(select 1 from public."Sale" where "productId"=p.id) and not exists(select 1 from public."Order" where "productId"=p.id and status='confirmada'),409,'Esta unidad ya tiene una reserva o venta registrada');
    end if;
    if operation='admin.reserve' and a ? 'orderId' then
      update public."Order" set status='confirmada',"updatedAt"=now() where id=o.id returning * into o;
    else
      insert into public."Order"(id,folio,"requestKey","productId","productNameSnapshot","priceSnapshot","customerName","customerPhone","consentAccepted","deliveryMode","shippingDestination",status,"createdAt","updatedAt")
        values(gen_random_uuid()::text,public.vc_store_folio(),a->>'requestKey',p.id,p.name||' · '||p.storage,p.price,a->>'customerName',a->>'customerPhone',operation='public.order.create',
          (jsonb_populate_record(null::public."Order",a))."deliveryMode",case when a->>'deliveryMode'='envio' then a->>'shippingDestination' else null end,
          case when operation='admin.reserve' then 'confirmada' else 'pendiente' end,now(),now()) returning * into o;
    end if;
    if operation='admin.reserve' then
      update public."Product" set status='Reservado',"updatedAt"=now() where id=p.id;
      insert into public."Delivery"(id,"orderId",mode,destination,status,"updatedAt") values(gen_random_uuid()::text,o.id,o."deliveryMode",o."shippingDestination",'pendiente',now()) on conflict("orderId") do nothing;
      perform public.vc_store_audit(actor,'reserve','Product',p.id,jsonb_build_object('orderId',o.id,'source','inventory','previousStatus',p.status));
      perform public.vc_store_audit(actor,case when a ? 'orderId' then 'status' else 'create' end,'Order',o.id,jsonb_build_object('source','inventory','to','confirmada'));
    end if;
    return jsonb_build_object('order',case when operation='public.order.create' then to_jsonb(o)-'requestKey'-'consentAccepted' else public.vc_store_order(o) end);
  elsif operation='admin.orders' then
    if coalesce(a->>'productId','')<>'' then
      select * into p from public."Product" where id=a->>'productId' or sku=a->>'productId';
      perform public.vc_store_assert(found,404,'Equipo no encontrado'); a:=a||jsonb_build_object('productId',p.id);
    end if;
    page_size:=least(100,greatest(1,coalesce((a->>'limit')::int,20)));
    select count(*) into total from public."Order" q where public.vc_store_order_matches(q,a);
    pages:=greatest(1,ceil(total::numeric/page_size)::int); page:=least(pages,greatest(1,coalesce((a->>'page')::int,1)));
    select coalesce(jsonb_agg(public.vc_store_order(t) order by t."createdAt" desc,t.id desc),'[]') into items
      from (select * from public."Order" q where public.vc_store_order_matches(q,a) order by q."createdAt" desc,q.id desc limit page_size offset (page-1)*page_size) t;
    return jsonb_build_object('orders',items,'total',total,'page',page,'pages',pages,'limit',page_size,'summary',jsonb_build_object(
      'pending',(select count(*) from public."Order" where status='pendiente'),'confirmed',(select count(*) from public."Order" where status='confirmada')));
  elsif operation='admin.order.status' then
    select * into existing from public."Order" where id=a->>'id';
    perform public.vc_store_assert(found,404,'Solicitud no encontrada');
    select * into p from public."Product" where id=existing."productId" for no key update;
    select * into o from public."Order" where id=existing.id for no key update;
    perform public.vc_store_assert(o.status in ('pendiente','confirmada'),409,'Esta solicitud ya está cerrada');
    perform public.vc_store_assert(o.status::text<>a->>'status',409,'La solicitud ya tiene ese estado');
    perform public.vc_store_assert(a->>'status' in ('confirmada','cancelada'),400,'Registra una venta para completar o cancela para liberar');
    if a->>'status'='confirmada' then
      perform public.vc_store_assert(p.status='Disponible' and not p."isArchived",409,'La unidad ya está reservada o vendida');
      update public."Product" set status='Reservado',"updatedAt"=now() where id=p.id;
      perform public.vc_store_audit(actor,'reserve','Product',p.id,jsonb_build_object('orderId',o.id));
    elsif o.status='confirmada' then
      perform public.vc_store_assert(p.status='Reservado',409,'El inventario cambió. Revisa la venta asociada');
      update public."Product" set status='Disponible',"updatedAt"=now() where id=p.id;
      perform public.vc_store_audit(actor,'release','Product',p.id,jsonb_build_object('orderId',o.id));
    end if;
    target:=o.status::text; o.status:=a->>'status';
    update public."Order" set status=o.status,"updatedAt"=now() where id=o.id returning * into o;
    perform public.vc_store_audit(actor,'status','Order',o.id,jsonb_build_object('from',target,'to',o.status));
    return jsonb_build_object('order',public.vc_store_order(o));
  elsif operation='admin.delivery' then
    select * into o from public."Order" where id=a->>'id' for no key update;
    delivery:=jsonb_populate_record(null::public."Delivery",a->'delivery');
    perform public.vc_store_assert(found and o.status<>'cancelada',409,'La solicitud no existe o está cancelada');
    perform public.vc_store_assert(o.status in ('confirmada','completada') or delivery.status='pendiente',409,'Confirma la solicitud antes de iniciar la entrega');
    insert into public."Delivery"(id,"orderId",mode,destination,carrier,"trackingNumber",status,notes,"updatedAt")
      values(gen_random_uuid()::text,o.id,delivery.mode,delivery.destination,delivery.carrier,delivery."trackingNumber",delivery.status,delivery.notes,now())
      on conflict("orderId") do update set mode=excluded.mode,destination=excluded.destination,carrier=excluded.carrier,"trackingNumber"=excluded."trackingNumber",status=excluded.status,notes=excluded.notes,"updatedAt"=now() returning * into delivery;
    update public."Order" set "deliveryMode"=delivery.mode,"shippingDestination"=case when delivery.mode='envio' then delivery.destination else null end,"updatedAt"=now() where id=o.id;
    perform public.vc_store_audit(actor,'delivery','Order',o.id,jsonb_build_object('status',delivery.status));
    return jsonb_build_object('delivery',to_jsonb(delivery));
  elsif operation='admin.sale.create' then
    select * into p from public."Product" where id=a->>'productId' or sku=a->>'productId' for no key update;
    perform public.vc_store_assert(found and not p."isArchived",404,'Equipo no encontrado');
    perform public.vc_store_assert(p.status<>'Vendido' and not exists(select 1 from public."Sale" where "productId"=p.id),409,'Esta unidad ya tiene una venta registrada');
    if a ? 'orderId' then
      select * into o from public."Order" where id=a->>'orderId' for no key update;
      perform public.vc_store_assert(found and o."productId"=p.id and o.status in ('pendiente','confirmada'),409,'La solicitud no corresponde o ya está cerrada');
    end if;
    perform public.vc_store_assert(not exists(select 1 from public."Order" q where q."productId"=p.id and q.status='confirmada' and q.id is distinct from o.id),409,'Esta unidad está reservada para otra solicitud');
    insert into public."Sale"(id,"orderId","productId","finalPrice","paymentMethod","soldAt") values(gen_random_uuid()::text,o.id,p.id,(a->>'finalPrice')::int,a->>'paymentMethod',now()) returning * into s;
    update public."Product" set status='Vendido',"updatedAt"=now() where id=p.id;
    if o.id is not null then update public."Order" set status='completada',"updatedAt"=now() where id=o.id; end if;
    perform public.vc_store_audit(actor,'sale','Product',p.id,jsonb_build_object('saleId',s.id,'orderId',o.id,'finalPrice',s."finalPrice"));
    return jsonb_build_object('sale',to_jsonb(s));
  elsif operation='admin.sales' then
    select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('product',to_jsonb(p),'order',to_jsonb(o)) order by s."soldAt" desc),'[]') into items
      from public."Sale" s join public."Product" p on p.id=s."productId" left join public."Order" o on o.id=s."orderId";
    return jsonb_build_object('sales',items);
  elsif operation='admin.config' then
    insert into public."BusinessConfig"(id,"businessName",whatsapp,"warrantyDays","noticesJson","updatedAt")
      values('default',a->>'businessName',a->>'whatsapp',(a->>'warrantyDays')::int,a->'noticesJson',now())
      on conflict(id) do update set "businessName"=excluded."businessName",whatsapp=excluded.whatsapp,"warrantyDays"=excluded."warrantyDays","noticesJson"=excluded."noticesJson","updatedAt"=now() returning * into config;
    perform public.vc_store_audit(actor,'update','BusinessConfig','default');
    return jsonb_build_object('config',to_jsonb(config));
  elsif operation='admin.audit' then
    select coalesce(jsonb_agg(to_jsonb(l)||jsonb_build_object('admin',jsonb_build_object('id',u.id,'name',u.name,'email',u.email)) order by l."createdAt" desc,l.id desc),'[]') into data
      from public."AuditLog" l join public."AdminUser" u on u.id=l."adminId"
      where (coalesce(a->>'action','')='' or l.action=a->>'action') and (coalesce(a->>'entityType','')='' or l."entityType"=a->>'entityType') and (coalesce(a->>'entityId','')='' or l."entityId"=a->>'entityId')
      and (coalesce(a->>'from','')='' or l."createdAt">=((a->>'from')::date::timestamp at time zone 'America/Mexico_City'))
      and (coalesce(a->>'to','')='' or l."createdAt"<(((a->>'to')::date+1)::timestamp at time zone 'America/Mexico_City'));
    total:=jsonb_array_length(data); page_size:=least(100,greatest(1,coalesce((a->>'limit')::int,25))); page:=greatest(1,coalesce((a->>'page')::int,1));
    select coalesce(jsonb_agg(v order by i),'[]') into items from jsonb_array_elements(data) with ordinality t(v,i) where i>(page-1)*page_size and i<=page*page_size;
    return jsonb_build_object('logs',items,'total',total,'page',page,'limit',page_size,'pages',greatest(1,ceil(total::numeric/page_size)::int));
  elsif operation='admin.dashboard' then
    select jsonb_build_object('revenue',coalesce(sum("finalPrice"),0),'salesCount',count(*),
      'monthRevenue',coalesce(sum("finalPrice") filter(where date_trunc('month',"soldAt" at time zone 'America/Mexico_City')=date_trunc('month',now() at time zone 'America/Mexico_City')),0),
      'monthSalesCount',count(*) filter(where date_trunc('month',"soldAt" at time zone 'America/Mexico_City')=date_trunc('month',now() at time zone 'America/Mexico_City'))) into data from public."Sale";
    data:=data||jsonb_build_object('inventory',(select jsonb_build_object('total',count(*),'available',count(*) filter(where status='Disponible' and not "isArchived"),'reserved',count(*) filter(where status='Reservado'),'sold',count(*) filter(where status='Vendido'),'archived',count(*) filter(where "isArchived")) from public."Product"),
      'pendingOrders',(select count(*) from public."Order" where status='pendiente'),
      'recentOrders',(select coalesce(jsonb_agg(to_jsonb(t) order by t."createdAt" desc),'[]') from (select * from public."Order" order by "createdAt" desc limit 8) t));
    select jsonb_agg(jsonb_build_object('label',(array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[extract(month from m)::int],
      'revenue',coalesce((select sum("finalPrice") from public."Sale" where date_trunc('month',"soldAt" at time zone 'America/Mexico_City')=m),0)) order by m)
      into items from (select date_trunc('month',now() at time zone 'America/Mexico_City')-make_interval(months=>n) m from generate_series(0,5) n) months;
    return data||jsonb_build_object('months',items);
  end if;
  perform public.vc_store_assert(false,404,'Ruta no encontrada');
  return null;
end $$;

-- Revoke default PUBLIC execution on every helper, not just the dispatcher.
revoke all on function public.vc_store_assert(boolean,integer,text), public.vc_store_audit(text,text,text,text,jsonb), public.vc_store_folio(),
  public.vc_store_product(public."Product",boolean), public.vc_store_order(public."Order"), public.vc_store_order_matches(public."Order",jsonb),
  public.vc_store_rate(text,integer,integer), public.vc_store_call(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.vc_store_assert(boolean,integer,text), public.vc_store_audit(text,text,text,text,jsonb), public.vc_store_folio(),
  public.vc_store_product(public."Product",boolean), public.vc_store_order(public."Order"), public.vc_store_order_matches(public."Order",jsonb),
  public.vc_store_rate(text,integer,integer), public.vc_store_call(text,jsonb,text) to service_role;
