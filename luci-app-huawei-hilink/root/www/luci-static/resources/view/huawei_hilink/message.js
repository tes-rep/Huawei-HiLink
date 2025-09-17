'use strict';'require view';'require request';'require ui';return view.extend({load:function(){return request.get('/cgi-bin/huawei_sms').then(res=>res.json())},render:function(data){const self=this;const smsRaw=(data&&data.sms&&data.sms.messages)?data.sms.messages:[];const style=E('style',{},`
		#sms-section { gap: .5rem; display: grid; }
		.toolbar { display:flex; flex-wrap:wrap; gap:.5rem; align-items:center; margin-bottom:.5rem; }
		.btn { border-radius:6px; }
		.badge { padding:.1rem .4rem; border-radius:999px; font-size:.75rem; }
		.badge.unread { background:#ffd8d8; color:#7a0000; }
		.badge.read { background:#e6ffe6; color:#145214; }
		table.sms-table { width:100%; border-collapse: collapse; }
		table.sms-table th, table.sms-table td { padding:.5rem .6rem; border-bottom:1px solid #e5e5e5; vertical-align: top; }
		table.sms-table th { text-align:left; font-weight:600; }
		td.message { max-width: 680px; white-space: normal; word-break: break-word; }
		.cards { display:none; gap:.75rem; }
		.card { border:1px solid #e5e5e5; border-radius:10px; padding:.6rem .75rem; box-shadow: 0 1px 0 rgba(0,0,0,.03); }
		.card .row { display:flex; align-items:center; justify-content:space-between; gap:.5rem; }
		.card .meta { font-size:.85rem; opacity:.85; display:flex; gap:.5rem; flex-wrap:wrap; }
		.card .msg { margin:.4rem 0; white-space: pre-wrap; word-break: break-word; }
		.card .actions { display:flex; gap:.5rem; flex-wrap:wrap; }
		@media (max-width: 900px){
			table.sms-table { display:none; }
			.cards { display:grid; }
		}
		.loading { padding:.75rem 0; }
		/* pastikan tombol delete merah di semua theme */
		.cbi-button.cbi-button-remove {
			background: #9b0000 !important;
			border-color: #9b0000 !important;
			color: #fff !important;
		}
		.cbi-button.cbi-button-remove:hover {
			background: #d32f2f !important;
			border-color: #b71c1c !important;
		}
		.cbi-button.cbi-button-remove:disabled {
			filter: grayscale(20%);
			opacity: .75;
		}
		`);const btn=(label,onclick,cls,disabled)=>E('button',{'class':'btn cbi-button '+(cls||''),click:disabled?null:onclick,disabled:disabled||null},label);function alertBox(title,message){ui.showModal(title||'Info',[E('p',{},message),E('div',{'class':'right'},[E('button',{'class':'btn',click:()=>ui.hideModal()},'OK')])])}
function confirmBox(title,message,onYes){ui.showModal(title||'Confirm Action',[E('p',{},message),E('div',{'class':'right'},[E('button',{'class':'btn cbi-button-apply',click:()=>{ui.hideModal();onYes&&onYes()}},'Yes'),' ',E('button',{'class':'btn cbi-button-remove',click:()=>ui.hideModal()},'Cancel')])])}
function refreshDataInto(sectionEl){sectionEl.replaceChildren(style,E('div',{'class':'loading'},'Loading…'));self.load().then(function(newData){const node=self.render(newData);if(node)sectionEl.replaceWith(node);}).catch(err=>alertBox('Error','Refresh failed: '+err))}
function apiRead(idxs,done){request.get('/cgi-bin/read_sms?index='+encodeURIComponent(idxs.join(','))).then(r=>r.json()).then(j=>{if(!j.ok)return alertBox('Error','Failed to mark read: '+(j.error||'unknown'));done&&done()}).catch(err=>alertBox('Error',err))}
function apiDelete(idxs,done){confirmBox('Confirm Action','Delete selected Message?',function(){request.get('/cgi-bin/delete_sms?index='+encodeURIComponent(idxs.join(','))).then(r=>r.json()).then(j=>{if(!j.ok)return alertBox('Error','Failed to delete: '+(j.error||'unknown'));done&&done()}).catch(err=>alertBox('Error',err))})}
function getSelectedIdx(){return Array.prototype.map.call(document.querySelectorAll('.rowchk:checked'),cb=>cb.getAttribute('data-index'))}
const refreshBtn=btn('Refresh',()=>refreshDataInto(section));const bulkDelBtn=btn('Delete',()=>{const sel=getSelectedIdx();if(!sel.length)return;apiDelete(sel,()=>refreshDataInto(section))},'cbi-button-remove');const toolbar=E('div',{'class':'toolbar'},[refreshBtn,' ',bulkDelBtn]);function makeTableRows(list){return list.map(m=>E('tr',{'class':'tr'},[E('td',{'class':'td'},[E('input',{type:'checkbox','class':'rowchk','data-index':m.Index})]),E('td',{'class':'td'},m.Date||''),E('td',{'class':'td'},m.Phone||''),E('td',{'class':'td message'},m.Content||''),E('td',{'class':'td'},[E('span',{'class':'badge '+(Number(m.Smstat)===1?'read':'unread')},Number(m.Smstat)===1?'Read':'Unread')]),E('td',{'class':'td'},[btn('Mark Read',()=>apiRead([m.Index],()=>refreshDataInto(section)),'',Number(m.Smstat)===1),' ',btn('Delete',()=>apiDelete([m.Index],()=>refreshDataInto(section)),'cbi-button-remove')])]))}
const table=E('table',{'class':'table cbi-section-table sms-table'},[E('tr',{'class':'tr table-titles'},[E('th',{'class':'th'},[E('input',{type:'checkbox',id:'chk-all',click:function(){document.querySelectorAll('.rowchk').forEach(cb=>cb.checked=this.checked)}})]),E('th',{'class':'th center'},'Time'),E('th',{'class':'th center'},'From'),E('th',{'class':'th center'},'Message'),E('th',{'class':'th center'},'Status'),E('th',{'class':'th center'},'Action')])]);function makeCards(list){return list.map(m=>E('div',{'class':'card'},[E('div',{'class':'row'},[E('div',{'class':'meta'},[E('span',{},m.Date||''),E('span',{},m.Phone||'')]),E('label',{},[E('input',{type:'checkbox','class':'rowchk','data-index':m.Index}),])]),E('div',{'class':'msg'},m.Content||''),E('div',{'class':'row'},[E('span',{'class':'badge '+(Number(m.Smstat)===1?'read':'unread')},Number(m.Smstat)===1?'Read':'Unread'),E('div',{'class':'actions'},[btn('Mark Read',()=>apiRead([m.Index],()=>refreshDataInto(section)),'',Number(m.Smstat)===1),btn('Delete',()=>apiDelete([m.Index],()=>refreshDataInto(section)),'cbi-button-remove')])])]))}
const cards=E('div',{'class':'cards'});const section=E('div',{'class':'cbi-section',id:'sms-section'},[style,E('h3',{},'Received Messages'),E('div',{'class':'cbi-section-descr'}),toolbar,table,cards]);makeTableRows(smsRaw).forEach(tr=>table.appendChild(tr));cards.replaceChildren(...makeCards(smsRaw));return section},handleSaveApply:null,handleReset:null,handleSave:null,})
