const MOCK_CARS = [
  { car_id: 1, name: "Swift", brand: "Maruti Suzuki", model: "2024", serial_num: "MSZ-101", price: 1200.00, status: "Available", fuel: "Petrol", transmission: "Manual", seats: 5, image: "images/maruti_swift.jpg", date: new Date().toISOString() },
  { car_id: 3, name: "Nexon", brand: "Tata", model: "2023", serial_num: "TAT-303", price: 1800.00, status: "Available", fuel: "Petrol", transmission: "Automatic", seats: 5, image: "images/tata_nexon.jpg", date: new Date().toISOString() },
  { car_id: 4, name: "Fortuner", brand: "Toyota", model: "2025", serial_num: "TOY-404", price: 4500.00, status: "Available", fuel: "Diesel", transmission: "Automatic", seats: 7, image: "images/toyota_fortuner.jpg", date: new Date().toISOString() },
  { car_id: 5, name: "Scorpio-N", brand: "Mahindra", model: "2025", serial_num: "MAH-505", price: 3000.00, status: "Available", fuel: "Diesel", transmission: "Automatic", seats: 7, image: "images/mahindra_scorpio.jpg", date: new Date().toISOString() },
  { car_id: 6, name: "Harrier", brand: "Tata", model: "2024", serial_num: "TAT-606", price: 2800.00, status: "Available", fuel: "Diesel", transmission: "Automatic", seats: 5, image: "images/tata_harrier.jpg", date: new Date().toISOString() }
];

const MOCK_USERS = [
  { user_id: 1, name: "Admin", email: "admin@gearlink.com", password: "password123", role: "admin", status: "Active" },
  { user_id: 2, name: "John Doe", email: "user@gearlink.com", password: "password123", role: "user", status: "Active" }
];

// Initialize Database on Page Load
function initDB() {
  const currentDbVer = "2.1";
  let cars = JSON.parse(localStorage.getItem('gl_cars'));
  let dbVer = localStorage.getItem('gl_db_ver');
  
  if (!cars || dbVer !== currentDbVer) {
    localStorage.setItem('gl_cars', JSON.stringify(MOCK_CARS));
    localStorage.setItem('gl_db_ver', currentDbVer);
  }

  if (!localStorage.getItem('gl_users')) {
    localStorage.setItem('gl_users', JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem('gl_rental_requests')) {
    localStorage.setItem('gl_rental_requests', JSON.stringify([]));
  }
  if (!localStorage.getItem('gl_penalties')) {
    localStorage.setItem('gl_penalties', JSON.stringify([]));
  }
}

// Database Getters/Setters
const DB = {
  get: (table) => JSON.parse(localStorage.getItem(`gl_${table}`)) || [],
  set: (table, data) => localStorage.setItem(`gl_${table}`, JSON.stringify(data)),

  // Specific entity logic
  getAvailableCars: () => DB.get('cars').filter(c => c.status === 'Available'),

  getCarById: (id) => DB.get('cars').find(c => c.car_id === parseInt(id)),

  updateCarStatus: (carId, newStatus) => {
    let cars = DB.get('cars');
    let index = cars.findIndex(c => c.car_id === parseInt(carId));
    if (index !== -1) {
      cars[index].status = newStatus;
      DB.set('cars', cars);
    }
  },

  createRentalRequest: (requestData) => {
    let reqs = DB.get('rental_requests');
    const newReqId = reqs.length > 0 ? reqs[reqs.length - 1].request_id + 1 : 1;
    let newReq = { request_id: newReqId, ...requestData, status: 'Pending', req_date: new Date().toISOString() };
    reqs.push(newReq);
    DB.set('rental_requests', reqs);
    return newReq;
  }
};

// Initialize immediately
initDB();
