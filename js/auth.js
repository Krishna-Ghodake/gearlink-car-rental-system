document.addEventListener("DOMContentLoaded", () => {
    // Check if already logged in
    const currentUser = JSON.parse(localStorage.getItem('gl_current_user'));
    if(currentUser) {
        window.location.href = currentUser.role === 'admin' ? 'dashboard-admin.html' : 'dashboard-user.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    if(!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        
        const users = DB.get('users');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            localStorage.setItem('gl_current_user', JSON.stringify({
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }));
            
            // Notification mechanism relying on script.js being present or manual alert
            alert(`Welcome back, ${user.name}!`);
            
            if(user.role === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                window.location.href = 'dashboard-user.html';
            }
        } else {
            alert('Invalid credentials. Please use the test accounts provided.');
        }
    });
});
