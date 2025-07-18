const BASE_LIMITS = { small: 150, medium: 300, large: 450 };
const DEFAULT_ML = { small: 5, medium: 10, large: 15 };
const USAGE_FACTORS = { light: 1, medium: 1.5, heavy: 2 };

let cartridges = JSON.parse(localStorage.getItem("cartridgeData")) || {};

function saveState() {
    localStorage.setItem("cartridgeData", JSON.stringify(cartridges));
    renderSummaries();
}

function refillCartridge() {
    const type = document.getElementById("cartridgeSelect").value;
    const ml = parseFloat(document.getElementById("mlInput").value) || DEFAULT_ML[type];
    if (!cartridges[type]) cartridges[type] = { ml, logs: [] };
    else { cartridges[type].ml = ml; cartridges[type].logs = []; }
    saveState();
    alert(`Refill done for ${type.toUpperCase()} Cartridge (${ml} ml)!`);
}

function editCartridge(type) {
    const newML = prompt("Enter new ink (ml):", cartridges[type].ml);
    if (newML !== null && !isNaN(parseFloat(newML))) {
        cartridges[type].ml = parseFloat(newML);
        saveState();
    }
}

function addLog() {
    const date = document.getElementById("dateInput").value;
    const pages = parseInt(document.getElementById("pagesInput").value);
    const usage = document.getElementById("usageSelect").value;
    const type = document.getElementById("cartridgeSelect").value;
    if (!date || isNaN(pages) || pages <= 0) return alert("Enter valid data!");
    if (!cartridges[type]) return alert("Please refill this cartridge first!");

    cartridges[type].logs.push({ date, pages, usage, ml: cartridges[type].ml });
    saveState();
    checkAlert(type);
}

function editLog(type, index) {
    const newPages = prompt("Update page count:", cartridges[type].logs[index].pages);
    if (newPages !== null && !isNaN(parseInt(newPages))) {
        cartridges[type].logs[index].pages = parseInt(newPages);
        saveState();
    }
}

function deleteLog(type, index) {
    if (confirm("Delete this log?")) {
        cartridges[type].logs.splice(index, 1);
        saveState();
    }
}

function deleteCartridge(type) {
    if (confirm(`Delete ${type.toUpperCase()} Cartridge and its logs?`)) {
        delete cartridges[type];
        saveState();
    }
}

function checkAlert(type) {
    const cart = cartridges[type];
    const totalPages = cart.logs.reduce((sum, l) => sum + l.pages * USAGE_FACTORS[l.usage], 0);
    const baseLimit = (BASE_LIMITS[type] * (cart.ml / DEFAULT_ML[type]));
    if (totalPages >= baseLimit) {
        alert(`⚠️ ${type.toUpperCase()} Cartridge: ~${totalPages} pages used (Limit ~${baseLimit}). Refill soon!`);
    }
}

function renderSummaries() {
    const container = document.getElementById("summaryContainer");
    container.innerHTML = "";

    for (let type in cartridges) {
        const cart = cartridges[type];
        const totalPages = cart.logs.reduce((sum, l) => sum + l.pages * USAGE_FACTORS[l.usage], 0);
        const baseLimit = (BASE_LIMITS[type] * (cart.ml / DEFAULT_ML[type]));
        const remainingPages = Math.max(0, baseLimit - totalPages);
        const percentage = Math.max(0, Math.min(100, (remainingPages / baseLimit) * 100));

        const usedRatio = totalPages / baseLimit;
        const remainingML = Math.max(0, cart.ml * (1 - usedRatio));

        let avgPerDay = 0;
        if (cart.logs.length > 0) {
            const dates = cart.logs.map(l => new Date(l.date));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const days = ((maxDate - minDate) / (1000*60*60*24)) + 1;
            avgPerDay = totalPages / days;
        }
        let estDays = avgPerDay > 0 ? (remainingPages / avgPerDay) : 0;
        let estDate = new Date();
        estDate.setDate(estDate.getDate() + estDays);

        let color = percentage > 60 ? "#00ff66" : percentage > 30 ? "#ffcc00" : "#ff4444";

        const summaryBox = document.createElement("div");
        summaryBox.className = "summary-box";
        summaryBox.innerHTML = `
            <h3>${type.toUpperCase()} Cartridge</h3>
            <p><strong>Ink Filled:</strong> ${cart.ml} ml</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${percentage}%; background:${color}">
                    ${percentage.toFixed(0)}% (${remainingML.toFixed(1)}ml left)
                </div>
            </div>
            <p><strong>Printed (Adj.):</strong> ${totalPages.toFixed(0)} pages</p>
            <p><strong>Remaining:</strong> ${remainingPages.toFixed(0)} pages</p>
            <p><strong>Next Refill:</strong> ${estDate.toDateString()} (${estDays.toFixed(1)} days)</p>
        `;

        cart.logs.forEach((log, idx) => {
            const perPageML = cart.ml / baseLimit; 
            const inkUsed = (log.pages * USAGE_FACTORS[log.usage] * perPageML).toFixed(2);

            const entry = document.createElement("div");
            entry.className = "log-entry";
            entry.innerHTML = `
                <div>${log.date} - ${log.pages} pages (${log.usage}) | <strong>Ink Used:</strong> ${inkUsed} ml</div>
                <div>
                    <button onclick="editLog('${type}', ${idx})">Edit</button>
                    <button onclick="deleteLog('${type}', ${idx})">Delete</button>
                </div>
            `;
            summaryBox.appendChild(entry);
        });

        const actionDiv = document.createElement("div");
        actionDiv.className = "action-buttons";
        const editBtn = document.createElement("button");
        editBtn.className = "edit-cartridge";
        editBtn.textContent = "Edit Cartridge";
        editBtn.onclick = () => editCartridge(type);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-cartridge";
        deleteBtn.textContent = "Delete Cartridge";
        deleteBtn.onclick = () => deleteCartridge(type);

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(deleteBtn);
        summaryBox.appendChild(actionDiv);

        container.appendChild(summaryBox);
    }
}

renderSummaries();
