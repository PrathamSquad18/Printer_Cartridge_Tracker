const BASE_LIMITS = { small:150, medium:300, large:450 };
const DEFAULT_ML = { small:5, medium:10, large:15 };
const USAGE_FACTORS = { light:1, medium:1.5, heavy:2 };

// Split storage for black & color
let cartridges = JSON.parse(localStorage.getItem("cartridgeDataV3")) || { black:{}, color:{} };

function saveState(){ localStorage.setItem("cartridgeDataV3", JSON.stringify(cartridges)); renderSummaries(); }

function refillCartridge(){
    const mode=document.getElementById("modeSelect").value;
    const type=document.getElementById("cartridgeSelect").value;
    const ml=parseFloat(document.getElementById("mlInput").value)||DEFAULT_ML[type];
    if(!cartridges[mode][type]) cartridges[mode][type]={ml,logs:[]};
    else {cartridges[mode][type].ml=ml; cartridges[mode][type].logs=[];}
    saveState(); alert(`Refill done for ${mode.toUpperCase()} - ${type.toUpperCase()} (${ml}ml)!`);
}

function addLog(){
    const date=document.getElementById("dateInput").value;
    const pages=parseInt(document.getElementById("pagesInput").value);
    const usage=document.getElementById("usageSelect").value;
    const mode=document.getElementById("modeSelect").value;
    const type=document.getElementById("cartridgeSelect").value;
    if(!date||isNaN(pages)||pages<=0) return alert("Enter valid data!");
    if(!cartridges[mode][type]) return alert("Please refill this cartridge first!");
    cartridges[mode][type].logs.push({date,pages,usage,ml:cartridges[mode][type].ml});
    saveState(); checkAlert(mode,type);
}

function editLog(mode,type,index){
    const val=prompt("Update page count:",cartridges[mode][type].logs[index].pages);
    if(val!==null&&!isNaN(parseInt(val))){ cartridges[mode][type].logs[index].pages=parseInt(val); saveState();}
}
function deleteLog(mode,type,index){ if(confirm("Delete this log?")){ cartridges[mode][type].logs.splice(index,1); saveState(); } }
function editCartridge(mode,type){
    const val=prompt("Enter new ink (ml):",cartridges[mode][type].ml);
    if(val!==null&&!isNaN(parseFloat(val))){ cartridges[mode][type].ml=parseFloat(val); saveState(); }
}
function deleteCartridge(mode,type){ if(confirm(`Delete ${mode} ${type} Cartridge?`)){ delete cartridges[mode][type]; saveState(); } }

function checkAlert(mode,type){
    const cart=cartridges[mode][type];
    const total=cart.logs.reduce((s,l)=>s+l.pages*USAGE_FACTORS[l.usage],0);
    const base=BASE_LIMITS[type]*(cart.ml/DEFAULT_ML[type]);
    if(total>=base) alert(`⚠️ ${mode.toUpperCase()} ${type.toUpperCase()} used ~${total} pages (Limit ~${base}). Refill soon!`);
}

function renderSummaries(){
    ["black","color"].forEach(mode=>{
        const container=document.getElementById(mode+"Summary");
        container.innerHTML="";
        for(let type in cartridges[mode]){
            const cart=cartridges[mode][type];
            const total=cart.logs.reduce((s,l)=>s+l.pages*USAGE_FACTORS[l.usage],0);
            const base=BASE_LIMITS[type]*(cart.ml/DEFAULT_ML[type]);
            const remaining=Math.max(0,base-total);
            const percentage=Math.max(0,Math.min(100,(remaining/base)*100));
            const remainingML=Math.max(0,cart.ml*(1-total/base));

            // Estimate refill date (unchanged)
            let avg=0; if(cart.logs.length){
                const dates=cart.logs.map(l=>new Date(l.date));
                const min=new Date(Math.min(...dates)); const max=new Date(Math.max(...dates));
                const days=((max-min)/(1000*60*60*24))+1; avg=total/days;
            }
            let estDays=avg>0?remaining/avg:0;
            let estDate=new Date(); estDate.setDate(estDate.getDate()+estDays);

	    // Last print date logic
                       // Last print date logic
            let lastPrint = cart.logs.length ? new Date(cart.logs[cart.logs.length - 1].date) : null;
            let warningMsg = "";
            if (lastPrint) {
            const daysSince = Math.floor((new Date() - lastPrint) / (1000*60*60*24));
            if (daysSince >= 7) {
                warningMsg = `<p style="color:#ff4444; text-shadow:0 0 8px #ff0000;">
                ⚠️ Last print was ${daysSince} days ago (${lastPrint.toDateString()}). 
                Print something or cartridge might block!
            </p>`;
           } else {
           warningMsg = `<p style="color:#00ff99;">Last print: ${lastPrint.toDateString()} (${daysSince} days ago)</p>`;
           }
           } else {
           warningMsg = `<p style="color:#ffaa00;">No prints yet! Print soon to avoid cartridge drying.</p>`;
           }
		
            let barColor=percentage>60?"#00ff66":percentage>30?"#ffcc00":"#ff4444";

            const box=document.createElement("div");
            box.className="summary-box";
            box.innerHTML=`
                <h3>${mode.toUpperCase()} - ${type.toUpperCase()} Cartridge</h3>
                <p><strong>Ink Filled:</strong> ${cart.ml} ml</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width:${percentage}%; background:${barColor}">
                        ${percentage.toFixed(0)}% (${remainingML.toFixed(1)}ml left)
                    </div>
                </div>
                <p><strong>Printed (Adj.):</strong> ${total.toFixed(0)} pages</p>
                <p><strong>Remaining:</strong> ${remaining.toFixed(0)} pages</p>
                <p><strong>Next Refill:</strong> ${estDate.toDateString()} (${estDays.toFixed(1)} days)</p>
		${warningMsg}
            `;

            cart.logs.forEach((log,i)=>{
                const perPage=cart.ml/base; const used=(log.pages*USAGE_FACTORS[log.usage]*perPage).toFixed(2);
                const entry=document.createElement("div"); entry.className="log-entry";
                entry.innerHTML=`
                    <div>${log.date} - ${log.pages} pages (${log.usage}) | <strong>Ink Used:</strong> ${used} ml</div>
                    <div>
                        <button onclick="editLog('${mode}','${type}',${i})">Edit</button>
                        <button onclick="deleteLog('${mode}','${type}',${i})">Delete</button>
                    </div>`;
                box.appendChild(entry);
            });

            const actions = document.createElement("div");
			actions.className = "action-buttons";
			actions.innerHTML = `
				<button class="edit-cartridge" onclick="editCartridge('${mode}','${type}')">Edit Cartridge</button>
				<button class="delete-cartridge" onclick="deleteCartridge('${mode}','${type}')">Delete Cartridge</button>
			`;
			box.appendChild(actions);
			container.appendChild(box);
        }
    });
}

function checkPrintReminder() {
    const now = new Date();

    ["black", "color"].forEach(mode => {
        for (let type in cartridges[mode]) {
            const logs = cartridges[mode][type].logs;
            if (!logs.length) continue;

            const lastPrint = new Date(logs[logs.length - 1].date);
            const diffDays = Math.floor((now - lastPrint) / (1000*60*60*24));

            if (diffDays >= 7) {
                // Popup Alert
                const popup = document.createElement("div");
                popup.className = "danger-popup";
                popup.innerText = `⚠ WARNING: Your ${mode.toUpperCase()} - ${type.toUpperCase()} cartridge hasn't printed for ${diffDays} days! Print soon to avoid blockage.`;
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 5000);

                // Red Text on Summary Card
                const cards = document.querySelectorAll(".summary-box h3");
                cards.forEach(card => {
                    if (card.innerText.includes(mode.toUpperCase()) && card.innerText.includes(type.toUpperCase())) {
                        const warn = document.createElement("div");
                        warn.className = "warning-text";
                        warn.innerText = `⚠ Last print was ${diffDays} days ago. Print soon to prevent blockage!`;
                        card.parentElement.appendChild(warn);
                    }
                });
            }
        }
    });
}

function showUsagePreview(){
    const type=document.getElementById("usageSelect").value;
    const img=type==="light"?"light.png":type==="medium"?"medium.png":"heavy.png";
    document.getElementById("usagePreview").innerHTML=`<img src="${img}" onclick="zoomImage('${img}')">`;
}
function zoomImage(src){ document.getElementById("modalImg").src=src; document.getElementById("imgModal").style.display="flex"; }

renderSummaries();
checkPrintReminder();
showUsagePreview();
