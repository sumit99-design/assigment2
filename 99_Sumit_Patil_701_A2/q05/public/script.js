const API_BASE = '/api';

// Login
$('#loginForm').submit(function(e) {
  e.preventDefault();
  $.post(API_BASE + '/login', { empid: $('#empid').val(), password: $('#password').val() }, function(data) {
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = 'profile.html';
    } else {
      alert('Error');
    }
  });
});

// Load profile
if (window.location.pathname.endsWith('profile.html')) {
  $.ajax({
    url: API_BASE + '/profile',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    success: function(data) {
      $('#profileData').html(`
        <p>EmpID: ${data.empid}</p>
        <p>Name: ${data.name}</p>
        <p>Email: ${data.email}</p>
        <p>Basic Salary: ${data.basicSalary}</p>
      `);
    },
    error: function() { window.location.href = 'login.html'; }
  });
}

// Leave form
$('#leaveForm').submit(function(e) {
  e.preventDefault();
  $.ajax({
    url: API_BASE + '/leave',
    method: 'POST',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    data: { date: $('#date').val(), reason: $('#reason').val() },
    success: function() { loadLeaves(); },
    error: function() { alert('Error: Unable to submit leave application'); }
  });
});

// Load leaves
function loadLeaves() {
  $.ajax({
    url: API_BASE + '/leaves',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    success: function(leaves) {
      $('#leaveList').html(leaves.map(l => `<li>${new Date(l.date).toLocaleDateString()} - ${l.reason} - Granted: ${l.grant ? 'Yes' : 'No'}</li>`).join(''));
    }
  });
}
if (window.location.pathname.endsWith('leave.html')) loadLeaves();

// Logout
$('#logout').click(function() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
});