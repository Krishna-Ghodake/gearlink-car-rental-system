// User Dashboard Logic
let currentUser = null;

function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function initDashboard() {
    currentUser = JSON.parse(localStorage.getItem('gl_current_user'));
    
    if(!currentUser || currentUser.role !== 'user') {
        window.location.href = 'login.html';
        return;
    }

    if (currentUser.points === undefined) {
        currentUser.points = 150; // Demo points
        localStorage.setItem('gl_current_user', JSON.stringify(currentUser));
        
        let users = DB.get('users');
        let index = users.findIndex(u => u.user_id === currentUser.user_id);
        if(index !== -1) {
            users[index].points = 150;
            DB.set('users', users);
        }
    }

    document.getElementById('userNameDisplay').innerText = currentUser.name;
    
    // Inject Gearpoints
    const gpContainer = document.getElementById('gearPointsContainer');
    if(gpContainer) {
        let isVip = currentUser.points >= 200;
        gpContainer.innerHTML = `
            <div style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white; padding: 1.5rem 2rem; border-radius: 8px; display: inline-block; box-shadow: 0 10px 20px rgba(0,210,255,0.2);">
                <div style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom:0.5rem; opacity:0.9;">GearPoints Balance</div>
                <div style="font-size: 2.5rem; font-weight: bold; line-height:1;">💎 ${currentUser.points}</div>
                ${isVip ? '<div style="margin-top:0.8rem; background:rgba(255,255,255,0.2); padding:0.4rem 0.8rem; border-radius:4px; font-size: 0.85rem; font-weight:600;"><i class="fas fa-crown"></i> VIP Status Active! 10% Off Base Rates</div>' : '<div style="margin-top:0.8rem; font-size:0.85rem; opacity:0.8;">Earn 50+ points for VIP 10% Discount!</div>'}
            </div>
        `;
    }
    
    // Check if redirected from a 'Book Now'
    const pendingCarId = sessionStorage.getItem('pending_booking_car_id');
    if (pendingCarId) {
        renderBookingForm(pendingCarId);
        switchTab('booking');
    } else {
        document.getElementById('bookingFormContainer').innerHTML = `
            <p>You haven't selected a car to book. <a href="index.html#cars" style="color:var(--primary-color);">Browse Cars</a>.</p>`;
    }

    renderHistory();
    renderPenalties();
}

function renderBookingForm(carId) {
    const car = DB.getCarById(carId);
    if(!car) return;

    const container = document.getElementById('bookingFormContainer');
    container.innerHTML = `
        <div style="display:flex; gap:2rem; align-items:flex-start;">
            <img src="${car.image}" style="width:300px; border-radius:10px;">
            <div style="flex:1;">
                <h4>${car.name} (${car.brand})</h4>
                <p style="color:var(--primary-color); font-size:1.2rem;">Price: ₹${car.price} / day</p>
                <div style="margin-bottom:1.5rem; font-size:0.9rem; color:var(--text-secondary); font-weight:600;">
                    ⛽ ${car.fuel} &nbsp;|&nbsp; ⚙️ ${car.transmission} &nbsp;|&nbsp; 🧍 Max ${car.seats} Seats
                </div>
                <form id="requestForm" style="margin-top:1.5rem;">
                    <label>Number of Passengers:</label>
                    <input type="number" id="requestedSeats" min="1" max="${car.seats}" value="1" required style="margin-top:0.5rem; margin-bottom:1rem;">

                    <label>Expected Rental Start Date:</label>
                    <input type="date" id="startDate" required style="margin-top:0.5rem; margin-bottom:1rem;">
                    
                    <label>Expected Return Date:</label>
                    <input type="date" id="endDate" required style="margin-top:0.5rem; margin-bottom:1rem;">
                    
                    <button type="submit" class="btn">Submit KYC & Request</button>
                    <button type="button" class="btn btn-outline" onclick="cancelBooking()">Cancel</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('requestForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const start = document.getElementById('startDate').value;
        const end = document.getElementById('endDate').value;
        const seats = document.getElementById('requestedSeats').value;
        
        DB.createRentalRequest({
            user_id: currentUser.user_id,
            car_id: car.car_id,
            start_date: start,
            end_date: end,
            requested_seats: seats
        });

        DB.updateCarStatus(car.car_id, "Pending");

        sessionStorage.removeItem('pending_booking_car_id');
        showToast("Rental Request Submitted! Awaiting Admin Approval", "success");
        
        setTimeout(() => {
            renderHistory();
            switchTab('history');
            document.getElementById('bookingFormContainer').innerHTML = `<p>Request sent. <a href="index.html#cars" style="color:var(--primary-color);">Browse more cars</a>.</p>`;
        }, 1500);
    });
}

function cancelBooking() {
    sessionStorage.removeItem('pending_booking_car_id');
    document.getElementById('bookingFormContainer').innerHTML = `<p>Booking cancelled. <a href="index.html#cars" style="color:var(--primary-color);">Browse Cars</a>.</p>`;
}

function renderHistory() {
    const reqs = DB.get('rental_requests').filter(r => r.user_id === currentUser.user_id);
    const container = document.getElementById('historyContainer');
    
    if(reqs.length === 0) {
        container.innerHTML = "<p>No rental history found.</p>";
        return;
    }

    let html = '';
    
    // First show active/approved rentals with Smart Keys
    let activeReqs = reqs.filter(r => r.status === 'Approved');
    if(activeReqs.length > 0) {
        html += `<h4 style="margin-bottom:1.5rem; color:var(--text-primary); font-family:var(--font-display); letter-spacing: 0.5px; font-size: 2rem;">Active Rentals</h4>`;
        activeReqs.forEach(req => {
            const car = DB.getCarById(req.car_id);
            html += `
            <div class="glass-panel" style="margin-bottom:2.5rem; display:flex; gap:2.5rem; flex-wrap:wrap; align-items:center; border: 1px solid rgba(255, 255, 255, 0.05);">
                <div style="flex:1.2; min-width:250px;">
                    <img src="${car.image}" style="width:100%; border-radius:12px; margin-bottom:1.2rem; border: 1px solid rgba(255,255,255,0.05);">
                    <h3 style="margin:0; font-size:2rem; color:var(--text-primary); font-family:var(--font-display); font-weight:300;">${car.name}</h3>
                    <p style="color:var(--text-secondary); font-size:0.9rem; margin:0.4rem 0;">Booking #${req.request_id} • Due: ${req.end_date}</p>
                    <button class="btn btn-outline" style="margin-top:1.2rem; border-color:var(--warning); color:var(--warning) !important; padding:0.5rem 1.2rem; font-size:0.85rem; border-radius:30px;" onclick="reportMaintenance(${req.car_id})">⚠️ Report Maintenance Issue</button>
                </div>
                
                <div style="flex:0.8; min-width:220px; background:linear-gradient(180deg, #18181b 0%, #09090b 100%); border-radius:20px; padding:2.5rem 2rem; text-align:center; position:relative; box-shadow: 0 15px 35px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="position:absolute; top:15px; right:20px; display: flex; align-items: center; gap: 6px;">
                        <span style="display:inline-block; width:6px; height:6px; background:var(--success); border-radius:50%;"></span>
                        <span style="color:var(--text-secondary); font-size:0.7rem; font-weight:500; text-transform:uppercase; letter-spacing:1px;">Active</span>
                    </div>
                    <div style="color:var(--text-primary); font-family:var(--font-family); font-size:0.75rem; font-weight:600; margin-bottom:2.2rem; text-transform:uppercase; letter-spacing:3px;">Digital Key</div>
                    
                    <div style="display:flex; justify-content:space-around; gap:1.2rem;">
                        <button onclick="triggerFob('lock')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); width:60px; height:60px; border-radius:50%; color:white; font-size:1.4rem; cursor:pointer; transition:all 0.3s ease;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.02)';">🔒</button>
                        <button onclick="triggerFob('unlock')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); width:60px; height:60px; border-radius:50%; color:white; font-size:1.4rem; cursor:pointer; transition:all 0.3s ease;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.02)';">🔓</button>
                        <button onclick="triggerFob('horn')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); width:60px; height:60px; border-radius:50%; color:white; font-size:1.4rem; cursor:pointer; transition:all 0.3s ease;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.background='rgba(255,255,255,0.05)';" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.background='rgba(255,255,255,0.02)';">🔊</button>
                    </div>
                </div>
            </div>
            `;
        });
    }

    // Then show the rest as a table
    let pastReqs = reqs.filter(r => r.status !== 'Approved');
    if (pastReqs.length > 0) {
        html += `<h4 style="margin-bottom:1rem; margin-top:2rem;">Rental History Logs</h4>`;
        html += `
            <table style="width:100%; text-align:left; border-collapse:collapse;">
                <thead>
                    <tr style="border-bottom:1px solid var(--border-color);">
                        <th style="padding:1rem;">Req ID</th>
                        <th style="padding:1rem;">Car</th>
                        <th style="padding:1rem;">Start Date</th>
                        <th style="padding:1rem;">Returns</th>
                        <th style="padding:1rem;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${pastReqs.map(req => {
                        const car = DB.getCarById(req.car_id);
                        return `
                        <tr style="border-bottom:1px solid rgba(0,0,0,0.05);">
                            <td style="padding:1rem;">#${req.request_id}</td>
                            <td style="padding:1rem;">${car.name}</td>
                            <td style="padding:1rem;">${req.start_date}</td>
                            <td style="padding:1rem;">${req.end_date}</td>
                            <td style="padding:1rem; color:${req.status === 'Completed' ? 'var(--success)' : (req.status === 'Pending' ? 'var(--warning)' : 'var(--danger)')};">
                                ${req.status}
                            </td>
                        </tr>`
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    container.innerHTML = html;
}

// Key Fob Interaction
function triggerFob(action) {
    if(action === 'lock') showToast("Doors Locked 🔒", "info");
    if(action === 'unlock') showToast("Doors Unlocked 🔓", "success");
    if(action === 'horn') showToast("BEEP BEEP! 🔊", "warning");
}

function reportMaintenance(carId) {
    const issue = prompt("Please describe the issue with your vehicle (e.g., Check Engine Light, Tire damage):");
    if(!issue) return;
    
    let logs = DB.get('maintenance');
    logs.push({
        ticket_id: logs.length > 0 ? logs[logs.length-1].ticket_id + 1 : 1,
        car_id: carId,
        user_id: currentUser.user_id,
        issue: issue,
        status: "Open",
        date: new Date().toISOString()
    });
    DB.set('maintenance', logs);
    
    showToast("Feedback submitted to Fleet Admin.", "success");
}

function renderPenalties() {
    const reqs = DB.get('rental_requests').filter(r => r.user_id === currentUser.user_id).map(r => r.request_id);
    const penalties = DB.get('penalties').filter(p => reqs.includes(p.request_id));
    
    const container = document.getElementById('penaltiesContainer');
    if(penalties.length === 0) {
        container.innerHTML = "<p>No penalties associated with your account.</p>";
        return;
    }

    container.innerHTML = penalties.map(p => `
        <div style="background:rgba(231, 76, 60, 0.1); border-left:4px solid var(--danger); padding:1rem; margin-bottom:1rem; border-radius:4px;">
            <h4 style="color:var(--danger);">Penalty Alert: ${p.reason}</h4>
            <p>Calculated Amount: <b>₹${parseFloat(p.amount).toFixed(2)}</b> (Associated with Booking #${p.request_id})</p>
        </div>
    `).join('');
}

document.addEventListener("DOMContentLoaded", initDashboard);
