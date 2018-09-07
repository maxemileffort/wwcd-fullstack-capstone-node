
//=======================
// Function Declarations
//=======================

function createNewUser(username, email, password){
    let payload = {
        username,
        email,
        password
    };
    
    $.ajax({
        type: 'POST',
        url: '/user/create/',
        dataType: 'json',
        data: JSON.stringify(payload),
        contentType: 'application/json',
        beforeSend: function(){
            //Possible load spinner for dashboard
            console.log(payload)
        }
    })
    //if call succeeds
    .done(function (result) {
        console.log(result);
        // redirect to dasboard
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
        $('#create-user-error').html(`
        <p>${jqXHR}</p>
        <p>${error}</p>
        <p>${errorThrown}</p>
        `)
    });
}

function loginUser(email, password){
    let payload = {
        email,
        password
    };
    
    $.ajax({
        type: 'POST',
        url: '/user/login/',
        dataType: 'json',
        data: JSON.stringify(payload),
        contentType: 'application/json',
        beforeSend: function(){
            //Possible load spinner for dashboard
            console.log(payload)
        }
    })
    //if call succeeds
    .done(function (result) {
        console.log(result);
        // redirect to dasboard
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
        $('#login-user-error').html(`
        <p>${jqXHR}</p>
        <p>${error}</p>
        <p>${errorThrown}</p>
        `)
    });
}

function sendStatsToDb(season, week){
    let period = {
        season,
        week
    };
    
    $.ajax({
        type: 'POST',
        url: '/send-stats-to-db',
        dataType: 'json',
        data: JSON.stringify(period),
        contentType: 'application/json',
        beforeSend: function(){
            $('.results').html(`<p>Retrieving projections...</p>`)
        }
    })
    //if call succeeds
    .done(function (result) {
        console.log(result);
        $('.results').html(`<p>Finished updating DB.</p><p>${result.msg}</p>`)
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
        $('.results').html(`
        <p>${jqXHR}</p>
        <p>${error}</p>
        <p>${errorThrown}</p>
        `)
    });
}

function sendSalariesToDb(file){
    $.ajax({
        url: "/send-salaries-to-db/",
        type: "POST",
        data: file,
        processData: false,
        contentType: false
    })
    //if call succeeds
    .done(function (result) {
        console.log(result);
        $('.results').html(`<p>Finished updating DB.</p><p>${result.msg}</p>`)
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
        $('.results').html(`
        <p>${jqXHR}</p>
        <p>${error}</p>
        <p>${errorThrown}</p>
        `)
    });
}


//====================
// BUTTON behaviors
//====================
//for opening the menu on screens smaller than 1000px
$('.toggleNav').on('click', function() {
    $('.flex-nav ul').toggleClass('open');
});

//updating db with player stats
$('#db-update').on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    let file = new FormData(this);
    let season = $('#season').val();
    let week = $('#week').val();
    if($("#salaries-file") === undefined || season === '' || week === ''){
        $('.results').html(`<p>All fields required</p>`);
        return false;
    } else {
        sendStatsToDb(season, week);
        sendSalariesToDb(file);
    }
})

// submission of landing page sign up form
$('#landing-user').on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    let username = $("#landing-username").val()
    let email = $("#landing-email").val()
    $("#create-username").val(username)
    $("#create-email").val(email)
    $("#landing-username").val('')
    $("#landing-email").val('')
})

// submission of sign up form
$('#create-user').on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    // grab values
    let username = $("#create-username").val()
    let email = $("#create-email").val()
    let password1 = $("#create-password1").val()
    let password2 = $("#create-password2").val()
    //validate input
    if(username === '' || email === '' || password1 === '' || password2 === ''){
        $('#create-user-error').html(`<p>All fields required</p>`);
        return false;
    } else if(password1 !== password2){
        $('#create-user-error').html(`<p>Passwords must match.</p>`);
        return false;
    } else {
        // create user and clear inputs
        createNewUser(username, email, password1);
        $("input").val('')
    }
})

// user submits login form
$('#login-user').on('submit', function(e){
    e.preventDefault();
    e.stopPropagation();
    // grab values
    let email = $("#login-email").val()
    let password = $("#login-password").val()
    // validate input
    if(email === '' || password === ''){
        $('#login-user-error').html(`<p>All fields required</p>`);
        return false;
    } else {
        // login user and clear inputs
        loginUser(email, password);
        $("input").val('')
    }
})



