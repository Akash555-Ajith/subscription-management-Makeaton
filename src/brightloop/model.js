export const TODAY='2026-10-31', KEY='bl_v2';
export const money=n=>'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:2});
const add=(d,n)=>new Date(+new Date(d)+n*864e5).toISOString().slice(0,10);
const names=['Acme Technologies','Nova Systems','Pixel Works','Greenfield Labs','Orbit Solutions','Vertex Digital','Bluewave Media','Quantum Labs','Skyline Tech','Apex Innovations','Zenith Software','CoreLogic','Bright Minds','NextGen IT','Fusion Systems','Prime Digital'];
export function seed(){
 const D={products:[['Odoo ERP','Software',12000,7000],['Cloud Storage','Service',2500,900],['CRM Suite','Software',8000,4500],['Security Pack','Service',4500,2100]].map((p,i)=>({id:'PRD-'+(1+i),name:p[0],type:p[1],price:p[2],cost:p[3]})),
 plans:[['Starter Monthly',999,'Monthly',1],['Professional Monthly',2499,'Monthly',1],['Business Yearly',24000,'Yearly',1],['Enterprise Yearly',48000,'Yearly',5]].map((p,i)=>({id:'PLN-'+(1+i),name:p[0],price:p[1],period:p[2],min:p[3],status:'Available'})),
 taxes:[{id:'TAX-1',name:'GST',rate:18,applies:'All products'}],
 discounts:[{id:'DSC-1',name:'Welcome 10%',type:'Percentage',value:10,limit:100,used:42,status:'Active'}],
 staff:[{id:'EMP001',name:'Arun Kumar',email:'staff@brightloop.com',phone:'+91 9876543210',status:'Active'}],
 users:[{name:'Admin',email:'admin@brightloop.com',pw:'Admin@123',role:'Admin'},{name:'Arun Kumar',email:'staff@brightloop.com',pw:'Staff@123',role:'Staff'},{name:'Acme User',email:'customer@acme.com',pw:'Customer@123',role:'Customer',company:'Acme Technologies'}],
 payments:[],invoices:[],audit:[]};
 D.customers=names.map((n,i)=>({id:'CUS-'+(101+i),name:n,email:n.toLowerCase().replace(/ /g,'')+'@example.com',phone:'+91 98'+String(10000000+i)}));
 D.subscriptions=names.map((c,i)=>{const p=D.plans[i%4],s=add('2026-08-01',i*4);return{id:'SUB-'+(1001+i),customer:c,plan:p.name,start:s,expiry:add(s,p.period==='Yearly'?365:120),terms:'Net 15',amount:p.price,status:['Active','Active','Active','Confirmed','Quotation','Draft','Closed'][i%7]}});
 D.subscriptions.forEach((s,i)=>{if(['Quotation','Draft'].includes(s.status))return;
  const amt=Math.round(s.amount*1.18),paid=i%3===0?0:i%5===0?Math.round(amt/2):amt,id='INV-'+(2001+i);
  D.invoices.push({id,customer:s.customer,subscription:s.id,date:s.start,due:add(s.start,15),amount:amt,paid,status:''});
  if(paid)D.payments.push({id:'PAY-'+(3001+i),date:add(s.start,3+i%9),invoice:id,customer:s.customer,method:['Razorpay','Bank Transfer','UPI','Cash','Card'][i%5],amount:paid,status:'Paid'})});
 return D}
export const uid=p=>p+'-'+Date.now().toString(36)+Math.floor(Math.random()*99);


export function entities(db) {
const planOf=s=>db.plans.find(p=>p.name===s.plan)||{};
const cNames=()=>db.customers.map(c=>c.name),pNames=()=>db.plans.map(p=>p.name);

/* entity config: cols [key,label,kind(m money,s status,p percent)], f [key,label,type(n,d,e,s),options,optional] */
const E={
 products:{t:'Products',s:'product',d:'Product catalogue and pricing.',cols:[['name','Product'],['type','Type'],['price','Sales price','m'],['cost','Cost price','m']],f:[['name','Name'],['type','Type','s',['Software','Service']],['price','Sales price','n'],['cost','Cost price','n']]},
 plans:{t:'Plans',s:'plan',d:'Recurring billing plans.',cols:[['name','Plan'],['price','Price','m'],['period','Period'],['min','Min. qty'],['status','Status','s']],f:[['name','Name'],['price','Price','n'],['period','Billing period','s',['Monthly','Yearly']],['min','Minimum quantity','n'],['status','Status','s',['Available','Disabled']]],used:r=>db.subscriptions.some(s=>s.plan===r.name)},
 subscriptions:{t:'Subscriptions',s:'subscription',d:'Track and manage customer subscriptions.',cols:[['id','Number'],['customer','Customer'],['plan','Plan'],['start','Start'],['expiry','Expiry'],['amount','Amount','m'],['status','Status','s']],f:[['customer','Customer','s',cNames],['plan','Plan','s',pNames],['start','Start date','d'],['expiry','Expiry date','d'],['terms','Payment terms','s',['Immediate','Net 15','Net 30']],['status','Status','s',['Draft','Quotation','Confirmed','Active','Closed','Cancelled']]],
  v:o=>o.expiry<=o.start?'Expiry must be after the start date.':'',post:o=>({amount:planOf(o).price||0}),pre:'SUB'},
 invoices:{t:'Invoices',s:'invoice',d:'Billing, collection and balances.',cols:[['id','Invoice'],['customer','Customer'],['date','Date'],['due','Due'],['amount','Amount','m'],['paid','Paid','m'],['status','Status','s']],f:[['customer','Customer','s',cNames],['date','Invoice date','d'],['due','Due date','d'],['amount','Amount (incl. tax)','n']],
  v:(o,r)=>o.due<o.date?'Due date cannot be before the invoice date.':r&&o.amount<r.paid?'Amount cannot be less than what is already paid.':'',init:()=>({paid:0}),pre:'INV'},
 payments:{t:'Payments',s:'payment',d:'Payment history.',cols:[['id','Payment'],['date','Date'],['invoice','Invoice'],['customer','Customer'],['method','Method'],['amount','Amount','m'],['status','Status','s']]},
 taxes:{t:'Taxes',s:'tax',d:'Tax rates applied to invoices.',cols:[['name','Tax'],['rate','Rate','p'],['applies','Applies to']],f:[['name','Name'],['rate','Rate (%)','n'],['applies','Applies to']],pre:'TAX'},
 discounts:{t:'Discounts',s:'discount',d:'Discount rules and usage.',cols:[['name','Discount'],['type','Type'],['value','Value'],['limit','Usage limit'],['used','Used'],['status','Status','s']],f:[['name','Name'],['type','Type','s',['Percentage','Fixed']],['value','Value','n'],['limit','Usage limit','n'],['status','Status','s',['Active','Disabled']]],init:()=>({used:0}),pre:'DSC'},
 customers:{t:'Customers',s:'customer',d:'Customer directory.',cols:[['name','Customer'],['email','Email'],['phone','Phone']],f:[['name','Company name'],['email','Email','e'],['phone','Phone','',null,1]],used:r=>db.subscriptions.some(s=>s.customer===r.name)||db.invoices.some(s=>s.customer===r.name),pre:'CUS'},
 staff:{t:'Staff',s:'staff member',d:'Staff roster. New staff sign in with the temporary password Staff@123.',cols:[['id','Employee ID'],['name','Name'],['email','Email'],['phone','Phone'],['status','Status','s']],f:[['name','Name'],['email','Email','e'],['phone','Phone','',null,1],['status','Status','s',['Active','Disabled']]],pre:'EMP'}};


return E;
}
export const NAV={Admin:[['Dashboard','◫'],['Products','▦'],['Plans','◷'],['Subscriptions','↻'],['Invoices','▣'],['Payments','₹'],['Taxes','%'],['Discounts','◇'],['Customers','♙'],['Staff','♧'],['Reports','▥'],['Rules & Regulations','⚖'],['Settings','⚙']],
 Staff:[['My Work','◫'],['Customers','♙'],['Subscriptions','↻'],['Quotations','▤'],['Invoices','▣'],['Payments','₹'],['Overdue','!'],['Reports','▥'],['Rules & Regulations','⚖']],
 Customer:[['Portal Overview','◫'],['My Subscriptions','↻'],['My Invoices','▣'],['My Payments','₹'],['Rules & Regulations','⚖']]};
export const sync=db=>db.invoices.forEach(i=>i.status=i.paid>=i.amount?'Paid':i.due<TODAY?'Overdue':'Pending');
export const mailOk=e=>/^\S+@\S+\.\S+$/.test(e);
