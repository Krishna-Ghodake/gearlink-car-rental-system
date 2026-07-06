// Admin Dashboard Logic
let currentUser = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function initDashboard() {
    currentUser = JSON.parse(localStorage.getItem('gl_current_user'));
    
    if(!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    renderAnalytics();
    renderFleet();
    renderRequests();
    renderTracking();
    renderMaintenance();
    renderPenalties();
}

function renderAnalytics() {
    const container = document.getElementById('analyticsContainer');
    const cars = DB.get('cars');
    const reqs = DB.get('rental_requests');
    const penalties = DB.get('penalties');
    
    let totalRevenue = reqs.filter(r => r.status === 'Completed' || r.status === 'Approved').reduce((sum, r) => {
        const car = DB.getCarById(r.car_id);
        if(!car) return sum;
        return sum + parseFloat(car.price); 
    }, 0);
    
    let totalPenalties = penalties.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    let currentlyBooked = cars.filter(c => c.status === 'Booked').length;
    let totalCars = cars.length;
    let utilization = totalCars === 0 ? 0 : Math.round((currentlyBooked / totalCars) * 100);

    let topCar = "None";
    if(reqs.length > 0) {
        let counts = {};
        reqs.forEach(r => counts[r.car_id] = (counts[r.car_id] || 0) + 1);
        let maxCarId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        let c = DB.getCarById(maxCarId);
        if(c) topCar = c.name;
    }

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.8rem; margin-bottom:2.5rem;">
            <div class="glass-panel" style="padding:2rem 1.8rem; text-align:center; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom: 0.8rem;">Total Revenue</div>
                <div style="font-size:2.4rem; font-weight:300; color:var(--text-primary); font-family:var(--font-display); letter-spacing: -0.5px;">₹${totalRevenue.toLocaleString('en-IN')}</div>
            </div>
            <div class="glass-panel" style="padding:2rem 1.8rem; text-align:center; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom: 0.8rem;">Penalty Recoveries</div>
                <div style="font-size:2.4rem; font-weight:300; color:var(--text-primary); font-family:var(--font-display); letter-spacing: -0.5px;">₹${totalPenalties.toLocaleString('en-IN')}</div>
            </div>
            <div class="glass-panel" style="padding:2rem 1.8rem; text-align:center; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom: 0.8rem;">Fleet Utilization</div>
                <div style="font-size:2.4rem; font-weight:300; color:var(--accent-color); font-family:var(--font-display); letter-spacing: -0.5px;">${utilization}%</div>
                <div style="font-size:0.8rem; color:var(--text-secondary); margin-top: 0.4rem; font-weight:400;">${currentlyBooked} of ${totalCars} Assets Active</div>
            </div>
            <div class="glass-panel" style="padding:2rem 1.8rem; text-align:center; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:1.5px; font-weight:500; margin-bottom: 0.8rem;">Most Popular Asset</div>
                <div style="font-size:1.8rem; font-weight:300; color:var(--text-primary); font-family:var(--font-display); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-top: 0.3rem;">${topCar}</div>
            </div>
        </div>
    `;
}

function renderMaintenance() {
    const container = document.getElementById('maintenanceContainer');
    const logs = DB.get('maintenance');
    
    if(logs.length === 0) {
        container.innerHTML = `<p style="padding:2rem; text-align:center; background:rgba(46, 204, 113, 0.1); color:var(--success); border-radius:8px;">Zero active maintenance alerts. Fleet is operating perfectly!</p>`;
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Date Reported</th>
                    <th>Asset Name</th>
                    <th>Issue Description</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    logs.forEach(log => {
        let car = DB.getCarById(log.car_id);
        let dateObj = new Date(log.date);
        let statusColor = log.status === 'Open' ? 'var(--danger)' : 'var(--success)';
        html += `
            <tr>
                <td style="font-family:monospace;">#TICK-${log.ticket_id}</td>
                <td>${dateObj.toLocaleDateString()}</td>
                <td>${car ? car.name : 'Unknown'}</td>
                <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${log.issue}">${log.issue}</td>
                <td style="color:${statusColor}; font-weight:bold;">${log.status}</td>
                <td>
                    ${log.status === 'Open' ? `<button class="btn btn-outline" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="resolveMaintenance(${log.ticket_id})">Mark Resolved</button>` : `<span style="font-size:0.8rem; color:var(--text-secondary);">Cleared</span>`}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

function resolveMaintenance(ticketId) {
    if(!confirm("Has this asset been fully repaired?")) return;
    let logs = DB.get('maintenance');
    let index = logs.findIndex(l => l.ticket_id === parseInt(ticketId));
    if(index !== -1) {
        logs[index].status = 'Resolved';
        DB.set('maintenance', logs);
        showToast("Maintenance ticket marked as securely resolved.", "success");
        renderMaintenance();
    }
}

// 1. Fleet Management Tab
function renderFleet() {
    const cars = DB.get('cars');
    const container = document.getElementById('fleetContainer');
    
    let html = `
        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem;">Register New Asset</h4>
            <div style="display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap;">
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Brand</label>
                    <input type="text" id="newCarBrand" value="Nissan" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Name</label>
                    <input type="text" id="newCarName" value="Magnite" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:0.5; min-width:80px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Year</label>
                    <input type="text" id="newCarModel" value="2025" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:1; min-width:120px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Serial Num</label>
                    <input type="text" id="newCarSerial" value="NIS-808" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:0.5; min-width:100px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Price (₹)</label>
                    <input type="number" id="newCarPrice" value="1500" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:0.5; min-width:100px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Fuel</label>
                    <select id="newCarFuel" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div style="flex:0.5; min-width:120px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Transmission</label>
                    <select id="newCarTrans" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                    </select>
                </div>
                <div style="flex:0.5; min-width:60px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Seats</label>
                    <input type="number" id="newCarSeats" value="5" min="2" max="10" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:1.5; min-width:150px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Image URL</label>
                    <input type="text" id="newCarImage" placeholder="Leave blank for automatic image" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <button class="btn" style="padding:0.5rem 1rem;" onclick="registerNewCar()">Add Car</button>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Serial #</th>
                    <th>Vehicle</th>
                    <th>Base Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${cars.map(car => `
                    <tr>
                        <td style="font-family:monospace; color:var(--primary-color);">${car.serial_num}</td>
                        <td>${car.name} (${car.brand})</td>
                        <td>₹${parseFloat(car.price).toFixed(2)}/day</td>
                        <td>
                            <span style="padding:4px 8px; border-radius:12px; font-size:0.8rem; background: ${car.status === 'Available' ? 'rgba(46, 204, 113, 0.2); color:var(--success);' : (car.status === 'Booked' ? 'rgba(241, 196, 15, 0.2); color:var(--warning);' : 'rgba(231, 76, 60, 0.2); color:var(--danger);')}">
                                ${car.status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-outline" style="border-color:var(--danger); color:var(--danger); padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="deleteCar(${car.car_id})">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function registerNewCar() {
    const brand = document.getElementById('newCarBrand').value;
    const name = document.getElementById('newCarName').value;
    const model = document.getElementById('newCarModel').value;
    const serial = document.getElementById('newCarSerial').value;
    const price = document.getElementById('newCarPrice').value;
    const fuel = document.getElementById('newCarFuel').value;
    const trans = document.getElementById('newCarTrans').value;
    const seats = document.getElementById('newCarSeats').value;
    let image = document.getElementById('newCarImage').value;

    if(!name || !brand || !model || !serial || !price || !seats) {
        showToast("Please fill out all required car details.", "danger");
        return;
    }

    if(!image) {
        image = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"; // Placeholder image
    }

    let cars = DB.get('cars');
    const newCarId = cars.length > 0 ? Math.max(...cars.map(c => c.car_id)) + 1 : 1;

    cars.push({
        car_id: newCarId,
        name: name,
        brand: brand,
        model: model,
        serial_num: serial,
        price: parseFloat(price),
        status: "Available",
        fuel: fuel,
        transmission: trans,
        seats: parseInt(seats),
        image: image,
        date: new Date().toISOString()
    });

    DB.set('cars', cars);
    showToast(`${brand} ${name} successfully registered to fleet!`, "success");
    renderFleet();
}

function deleteCar(carId) {
    if(!confirm("Are you sure you want to completely remove this vehicle from the fleet?")) return;
    
    let cars = DB.get('cars');
    cars = cars.filter(c => c.car_id !== parseInt(carId));
    DB.set('cars', cars);
    
    showToast("Vehicle retired from fleet.", "success");
    renderFleet();
}

// 2. Pending Rentals Tab
function renderRequests() {
    const reqs = DB.get('rental_requests');
    const container = document.getElementById('requestsContainer');
    const pendingReqs = reqs.filter(r => r.status === 'Pending');

    if(pendingReqs.length === 0) {
        container.innerHTML = "<p>No pending requests.</p>";
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Req ID</th>
                    <th>Vehicle</th>
                    <th>User ID</th>
                    <th>Period</th>
                    <th>Passengers</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pendingReqs.map(req => {
                    const car = DB.getCarById(req.car_id);
                    return `
                    <tr>
                        <td>#${req.request_id}</td>
                        <td>${car ? car.name : 'Unknown Car'}</td>
                        <td>#${req.user_id}</td>
                        <td>${req.start_date} to ${req.end_date}</td>
                        <td style="text-align:center; font-weight:bold;">${req.requested_seats || 'N/A'}</td>
                        <td>
                            <button class="btn" style="padding:0.4rem 1rem; font-size:0.8rem;" onclick="processRequest(${req.request_id}, 'Approve')">Approve</button>
                            <button class="btn btn-outline" style="padding:0.4rem 1rem; font-size:0.8rem; border-color:var(--danger); color:var(--danger);" onclick="processRequest(${req.request_id}, 'Reject')">Reject</button>
                        </td>
                    </tr>`
                }).join('')}
            </tbody>
        </table>
    `;
}

function processRequest(reqId, action) {
    let reqs = DB.get('rental_requests');
    let index = reqs.findIndex(r => r.request_id === parseInt(reqId));
    
    if(index !== -1) {
        if(action === 'Approve') {
            reqs[index].status = 'Approved';
            DB.updateCarStatus(reqs[index].car_id, "Booked");
            showToast(`Request #${reqId} Approved`, 'success');
        } else {
            reqs[index].status = 'Rejected';
            DB.updateCarStatus(reqs[index].car_id, "Available");
            showToast(`Request #${reqId} Rejected`, 'danger');
        }
        DB.set('rental_requests', reqs);
        
        renderRequests();
        renderTracking();
        renderFleet();
    }
}

// 3. Live Tracking System
function renderTracking() {
    const cars = DB.get('cars');
    const reqs = DB.get('rental_requests').filter(r => r.status === 'Approved');
    const users = DB.get('users');
    const container = document.getElementById('trackingContainer');
    
    let html = '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">';
    
    cars.forEach(car => {
        let location = "Parking Lot A (Headquarters)";
        let driverInfo = "N/A - Vehicle Available";
        let statusColor = "var(--text-secondary)";
        let mapBg = "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400')"; 
        
        if (car.status === 'Booked') {
            const activeReq = reqs.find(r => r.car_id === car.car_id);
            if (activeReq) {
                const driver = users.find(u => u.user_id === activeReq.user_id);
                driverInfo = "Driver: " + (driver ? driver.name : 'Unknown') + " (UID: #" + activeReq.user_id + ")";
                location = "En Route: 19." + Math.floor(1000 + Math.random() * 9000) + ", 73." + Math.floor(1000 + Math.random() * 9000);
                statusColor = "var(--success)";
                mapBg = "url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&q=80&w=400')"; 
            }
        } else if (car.status === 'Pending') {
             driverInfo = "Pending Approval";
        }
        
        let time = new Date().toLocaleTimeString();
        
        html += `
        <div style="border:1px solid rgba(0,0,0,0.1); border-radius:8px; overflow:hidden; background:var(--glass-bg); box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
            <div style="height:120px; background: ${mapBg} center/cover; position:relative;">
                <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:#fff; padding:4px 8px; border-radius:4px; font-family:monospace; font-size:0.75rem;">GPS: ONLINE</div>
            </div>
            <div style="padding:1rem;">
                <h4 style="margin-bottom:0.5rem; display:flex; justify-content:space-between;">
                    ${car.name} <span style="font-size:0.8rem; font-weight:bold; color:${statusColor};">${car.status}</span>
                </h4>
                <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
                    <p style="margin: 0.2rem 0;"><strong>👤</strong> ${driverInfo}</p>
                    <p style="margin: 0.2rem 0;"><strong>📍</strong> ${location}</p>
                    <p style="margin: 0.2rem 0;"><strong>⏱️</strong> Last Ping: ${time}</p>
                </div>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 4. Automated Penalties Management
function renderPenalties() {
    const penalties = DB.get('penalties');
    const container = document.getElementById('penaltiesContainer');
    const reqs = DB.get('rental_requests');
    const approvedReqs = reqs.filter(r => r.status === 'Approved');

    let html = `
        <div style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
            <h4 style="margin-bottom: 1rem;">Issue Custom Penalty</h4>
            <div style="display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap;">
                <div style="flex:1; min-width:200px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Select Approved Rental</label>
                    <select id="simulateReqSelect" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                        <option value="">Select Rental...</option>
                        ${approvedReqs.map(r => {
                            const car = DB.getCarById(r.car_id);
                            return `<option value="${r.request_id}">Req #${r.request_id} - ${car ? car.name : 'Unknown Car'}</option>`;
                        }).join('')}
                    </select>
                </div>
                <div style="flex:2; min-width:300px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Penalty Reason / Description</label>
                    <input type="text" id="penaltyReasonInput" placeholder="e.g. Scratched bumper, interior damage..." style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <div style="flex:0.5; min-width:120px;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-secondary);">Amount (₹)</label>
                    <input type="number" id="penaltyAmountInput" placeholder="500" style="width:100%; margin:0; padding:0.5rem; border-radius:4px; border:1px solid var(--border-color);">
                </div>
                <button class="btn btn-outline" style="border-color:var(--danger); color:var(--danger); padding:0.5rem 1rem;" onclick="issueCustomPenalty()">Issue Penalty</button>
            </div>
        </div>
    `;

    if(penalties.length > 0) {
        html += `
            <table>
                <thead>
                    <tr><th>Penalty ID</th><th>Req ID</th><th>Vehicle</th><th>Reason</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${penalties.map(p => {
                        const req = reqs.find(r => r.request_id === p.request_id);
                        const car = req ? DB.getCarById(req.car_id) : null;
                        const carName = car ? car.name : 'Unknown';
                        return `
                        <tr>
                            <td>#${p.penalty_id}</td>
                            <td>#${p.request_id}</td>
                            <td>${carName}</td>
                            <td>${p.reason}</td>
                            <td style="color:var(--danger); font-weight:bold;">₹${parseFloat(p.amount).toFixed(2)}</td>
                            <td>${p.status}</td>
                            <td>
                                <button class="btn btn-outline" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="editPenalty(${p.penalty_id})">Edit</button>
                                <button class="btn btn-outline" style="border-color:var(--danger); color:var(--danger); padding:0.3rem 0.6rem; font-size:0.8rem; margin-left:0.5rem;" onclick="deletePenalty(${p.penalty_id})">Del</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else {
        html += "<p>No active penalties logged in the system.</p>";
    }

    container.innerHTML = html;
}

function issueCustomPenalty() {
    const reqId = document.getElementById('simulateReqSelect').value;
    const reason = document.getElementById('penaltyReasonInput').value;
    const amount = document.getElementById('penaltyAmountInput').value;

    if(!reqId || !reason || !amount) {
        alert("Please select a rental, describe the reason, and enter a penalty amount.");
        return;
    }

    let reqs = DB.get('rental_requests');
    let req = reqs.find(r => r.request_id === parseInt(reqId));
    
    if(req) {
        let penalties = DB.get('penalties');
        const newPenaltyId = penalties.length > 0 ? penalties[penalties.length - 1].penalty_id + 1 : 1;
        
        penalties.push({
            penalty_id: newPenaltyId,
            request_id: req.request_id,
            reason: reason,
            amount: parseFloat(amount).toFixed(2),
            status: "Unpaid"
        });

        DB.set('penalties', penalties);
        
        // Mark rental as Completed & Car returned to Available for demo purposes
        req.status = "Completed with Penalty";
        DB.set('rental_requests', reqs);
        DB.updateCarStatus(req.car_id, "Available");

        showToast(`Penalty of ₹${parseFloat(amount).toFixed(2)} issued successfully!`, "danger");
        
        renderPenalties();
        renderFleet();
        renderTracking();
        renderRequests();
    }
}

function editPenalty(penaltyId) {
    let penalties = DB.get('penalties');
    let penalty = penalties.find(p => p.penalty_id === parseInt(penaltyId));
    
    if(!penalty) return;
    
    const newReason = prompt("Edit Penalty Reason:", penalty.reason);
    if(newReason === null) return;
    
    const newAmount = prompt("Edit Penalty Amount (₹):", penalty.amount);
    if(newAmount === null) return;
    
    penalty.reason = newReason;
    penalty.amount = parseFloat(newAmount).toFixed(2);
    
    DB.set('penalties', penalties);
    showToast("Penalty successfully updated.", "success");
    renderPenalties();
}

function deletePenalty(penaltyId) {
    if(!confirm("Are you sure you want to completely remove this penalty record?")) return;
    
    let penalties = DB.get('penalties');
    penalties = penalties.filter(p => p.penalty_id !== parseInt(penaltyId));
    DB.set('penalties', penalties);
    
    showToast("Penalty deleted.", "success");
    renderPenalties();
}

document.addEventListener("DOMContentLoaded", initDashboard);
