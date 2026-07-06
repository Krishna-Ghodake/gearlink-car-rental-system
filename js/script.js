// UI Utility: Show Notification
function showToast(message, type = "info") {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Ensure login status toggles navbar appropriately
function setupAuthLinks() {
    const activeUserContainer = document.getElementById('auth-link-container');
    if (!activeUserContainer) return;

    const currentUser = JSON.parse(localStorage.getItem('gl_current_user'));

    if (currentUser) {
        activeUserContainer.innerHTML = `
            <a href="${currentUser.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-user.html'}" class="btn">
                Dashboard (${currentUser.name})
            </a>
            <a href="#" id="logout-btn" style="margin-left: 10px; color: var(--danger);">Logout</a>
        `;
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('gl_current_user');
            window.location.reload();
        });
    } else {
        activeUserContainer.innerHTML = `<a href="login.html" class="btn">Login / Register</a>`;
    }
}

// Cars Rendering Logic
function renderCars() {
    const container = document.getElementById('carsContainer');
    if (!container) return; // not on index page

    container.innerHTML = "";

    // Use DB singleton logic from db.js
    let cars = DB.getAvailableCars();
    
    // Read Filter States
    const searchInput = document.getElementById('carSearch');
    const filterText = searchInput ? searchInput.value.toLowerCase() : "";
    const fuelFilter = document.getElementById('filterFuel') ? document.getElementById('filterFuel').value : "All";
    const transFilter = document.getElementById('filterTrans') ? document.getElementById('filterTrans').value : "All";
    const seatFilter = document.getElementById('filterSeats') ? document.getElementById('filterSeats').value : "All";

    if (filterText) {
        cars = cars.filter(c =>
            c.name.toLowerCase().includes(filterText) ||
            c.brand.toLowerCase().includes(filterText)
        );
    }
    
    if (fuelFilter !== "All") {
        cars = cars.filter(c => c.fuel === fuelFilter);
    }
    
    if (transFilter !== "All") {
        cars = cars.filter(c => c.transmission === transFilter);
    }
    
    if (seatFilter !== "All") {
        cars = cars.filter(c => c.seats === parseInt(seatFilter));
    }

    if (cars.length === 0) {
        container.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No cars available right now.</p>`;
        return;
    }

    cars.forEach(car => {
        const div = document.createElement('div');
        div.className = 'car-card';
        // Add ID parameter to URL if booking
        div.innerHTML = `
            <div class="car-image-container">
                <img src="${car.image}" alt="${car.name}" class="car-image">
            </div>
            <div class="car-details">
                <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary);">${car.brand}</span>
                <h3>${car.name} <span style="font-size: 0.95rem; color: var(--text-secondary); font-family: var(--font-family); font-weight: 300;">(${car.model})</span></h3>
                
                <div class="car-specs-grid">
                    <div class="car-spec-item">
                        <span style="color:var(--text-secondary); font-size:0.65rem;">Fuel</span>
                        <span class="car-spec-val">${car.fuel}</span>
                    </div>
                    <div class="car-spec-item">
                        <span style="color:var(--text-secondary); font-size:0.65rem;">Drive</span>
                        <span class="car-spec-val">${car.transmission}</span>
                    </div>
                    <div class="car-spec-item">
                        <span style="color:var(--text-secondary); font-size:0.65rem;">Seats</span>
                        <span class="car-spec-val">${car.seats} Seats</span>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.03);">
                    <span class="car-price" style="margin-bottom:0;">₹${parseFloat(car.price)} <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:400; text-transform:lowercase; font-family:var(--font-family);">/ day</span></span>
                    <button class="btn btn-outline" style="padding: 0.5rem 1.2rem; font-size:0.75rem;" onclick="bookCar(${car.car_id})">Book</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function bookCar(carId) {
    const user = JSON.parse(localStorage.getItem('gl_current_user'));
    if (!user) {
        showToast("Please login to book a car", "warning");
        setTimeout(() => window.location.href = "login.html", 1000);
        return;
    }
    if (user.role === 'admin') {
        showToast("Admins cannot book cars directly.", "danger");
        return;
    }
    // Redirect to renter dashboard with car id hash or save to session
    sessionStorage.setItem('pending_booking_car_id', carId);
    window.location.href = `dashboard-user.html#book`;
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    setupAuthLinks();

    const carSearch = document.getElementById('carSearch');
    if (carSearch) {
        carSearch.addEventListener('keyup', renderCars);
        document.getElementById('filterFuel').addEventListener('change', renderCars);
        document.getElementById('filterTrans').addEventListener('change', renderCars);
        document.getElementById('filterSeats').addEventListener('change', renderCars);
        renderCars();
    }
});
