(()=>{'use strict';
const base=globalThis.parseSource;
if(typeof base!=='function')throw new Error('rules-parser.js must load before rule-updates.js');
const text='2.7.2 Запрещена покупка и продажа донатной валюты за игровую валюту или иные внутриигровые ценности. | BAN до 30 дней + изъятие полученных в рамках сделки игровых ценностей.\n\nПримечание: Запрещается приобретать или продавать донатную валюту за виртуальную валюту, имущество, транспортные средства и другие игровые ценности, в том числе посредством пополнения донатного баланса другого игрока в обмен на игровую валюту. Правило распространяется на любые формы подобных сделок, независимо от используемого способа передачи средств и наличия действующих акций или бонусов на пополнение донатного баланса.';
globalThis.parseSource=function(raw){
const topics=base(raw),topic=topics.find(t=>t.title==='Общие правила проекта');
if(!topic)throw new Error('Не найден раздел общих правил для обновления 2.7.2');
const current=topic.items.find(r=>r.number==='2.7.2');
if(current){current.text=text;return topics}
const anchor=topic.items.findIndex(r=>r.number==='2.7.1');
if(anchor<0)throw new Error('Не найден пункт 2.7.1 для вставки 2.7.2');
topic.items.splice(anchor+1,0,{number:'2.7.2',chapter:topic.items[anchor].chapter,text,id:topic.id+'-rule-2-7-2'});
return topics;
};
})();
