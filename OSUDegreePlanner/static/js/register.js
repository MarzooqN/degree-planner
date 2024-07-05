document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from being submitted immediately

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('error');
    const usernameErrorElement = document.getElementById('usernameError');
    const username = document.getElementById('username').value;

    if (password !== confirmPassword) {
        errorElement.style.display = 'block';
        usernameErrorElement.style.display = 'none';
        return;
    } else {
        errorElement.style.display = 'none';
    }

    fetch('/check_username', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.available) {
            usernameErrorElement.style.display = 'block';
        } else {
            usernameErrorElement.style.display = 'none';

            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = "/login";
                } 
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});


function unHidePassword(){
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (password.type === 'password'){
        password.type = 'text'
        confirmPassword.type = 'text'
    } else {
        password.type = 'password'
        confirmPassword.type = 'password'
    }
}