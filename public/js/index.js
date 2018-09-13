
//=======================
// Variable Declarations
//=======================
// used for rendering lineups
let projections, salaries, position, avg;


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
            console.log(payload.email)
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

function checkEmailExists (inputEmail){
    $.ajax({
        type: 'GET',
        url: `/check-duplicate-email/${inputEmail}`,
        dataType: 'json',
        contentType: 'application/json'
    })
    //if call succeeds
    .done(function (result) {
        console.log(result);
        if (result.entries.length != 0){
            //let user know email address is being used already
            $("#create-user-error").html('<p>That email is already in use. Try logging in instead.</p>')
            $("#create-submit").attr("disabled", "disabled")
        } else {
            // proceed with creating account
            $("#create-submit").attr("disabled", false)
            return false
        }
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
    });
}

function getProjections(period){
    console.log(period)
    $.ajax({
        type: 'GET',
        url: `/get-projections/${period.season}/${period.week}`,
        dataType: 'json',
        contentType: 'application/json'
    })
    //if call succeeds
    .done(function (result) {
        projections = result; // set global variable equal to returned result to access in other functions
        console.log(projections)
        // this function was a bottle neck, 
        // so changed it to where data flow continues here
        getSalaries(period);
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
    });
}

function getSalaries(period){
    console.log(period)
    $.ajax({
        type: 'GET',
        url: `/get-salaries/${period.season}/${period.week}`,
        dataType: 'json',
        contentType: 'application/json'
    })
    //if call succeeds
    .done(function (result) {
        salaries = result; // set global variable equal to returned result to access in other functions
        console.log(salaries)
        // placed here since it needs to fire after the calls to the db
        renderDashboardPlayerList(position)
    })
    //if the call fails
    .fail(function (jqXHR, error, errorThrown) {
        console.log(jqXHR);
        console.log(error);
        console.log(errorThrown);
    });
}

function getPlayerList(renderArr){
    // renders the initial player list, sorted by tier
    let tierArr = renderArr.sort(function(a, b){
        return a.tier - b.tier;
    })
    // for adding click handlers:
    let idArr = []
    
    // construct html from the tier array as the whole list
    let tierOutput = '';
    tierOutput += "<ul>"
    tierArr.forEach(el=>{
        tierOutput += `<li class='player player-${el.id}'>
        <a class="player-report" href="https://www.google.com/search?q=${el.name.split(' ').join('+')}" target="_blank">
        Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}
        </a>
        </li>`
        tierOutput += "<hr>"
        idArr.push(el.id) // adding el.id to this arr in order to add click handlers in the next block
    })
    tierOutput += "</ul>"
	// render tier list
    $("#dashboard-player-list").html(tierOutput);
    // will be used for the lineup feature
    // idArr.forEach(el=>{ // elements of this array are already id's
    //     $(`.player-${el}`).on('click', event=>{
    //         handlePlayerClick(event)
    //         console.log(event)
    //         // event.stopPropagation();
    //     })
    // })
}

function getTopFivePoints(renderArr){
    // renders the top 5 players for porjected points
    let pointsArr = renderArr.sort(function(a, b){
        return b.points - a.points;
    }).slice(0, 5)
    let pointsOutput = '';
    pointsOutput += "<ul>"
    pointsArr.forEach(el=>{
        pointsOutput += `<li class='player player-${el.id}'>Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}</li>`
        pointsOutput += "<hr>"
    })
    pointsOutput += "</ul>"
    // render points list
    $("#top-5-points").html(pointsOutput);
}

function getTopFiveFloor(renderArr){
    // renders the top 5 players with the best floor
    let floorArr = renderArr.sort(function(a, b){
        return b.floor - a.floor;
    }).slice(0, 5)
    let floorOutput = '';
    floorOutput += "<ul>"
    floorArr.forEach(el=>{
        floorOutput += `<li class='player player-${el.id}'>Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}</li>`
        floorOutput += "<hr>"
    })
    floorOutput += "</ul>"
    // render floor list
    $("#top-5-floor").html(floorOutput);
}

function getTopFiveCeiling(renderArr){
    // renders top 5 players with highest ceiling
    let ceilingArr = renderArr.sort(function(a, b){
        return b.ceiling - a.ceiling;
    }).slice(0, 5)
    let ceilingOutput = '';
    ceilingOutput += "<ul>"
    ceilingArr.forEach(el=>{
        ceilingOutput += `<li class='player player-${el.id}'>Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}</li>`
        ceilingOutput += "<hr>"
    })
    ceilingOutput += "</ul>"
    // render ceiling list
    $("#top-5-ceiling").html(ceilingOutput);
}

function getTopFiveValue(renderArr){
    // renders top 5 players based on points / salary
    let valArr = renderArr.sort(function(a, b){
        let aVal = a.points / (a.salary / 1000)
        let bVal = b.points / (b.salary / 1000)
        return bVal - aVal;
    }).slice(0, 5)
    let valOutput = '';
    valOutput += "<ul>"
    valArr.forEach(el=>{
        valOutput += `<li class='player player-${el.id}'>Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}</li>`
        valOutput += "<hr>"
    })
    valOutput += "</ul>"
    // render val list
    $("#top-5-value").html(valOutput);
}

function getTopFiveInsight(renderArr){
    // rating based on a way that relates players' points averages to their salary, rank, and tier
    let insightArr = renderArr.sort(function(a, b){
        if (a.points === 0 || a.ceiling === 0 || a.floor === 0
             || b.points === 0 || b.ceiling === 0 || b.floor === 0){
            return false
        }
        else {
            // the reasoning behind this is: 
            // the points values are averaged, in an effort to manage player production expectations. Sort of a weak correction for wide ranges.
            // in order for the insight value to stay high (which is good), salary has to decrease, while rank and tier should increase.
            // the bottom number (number with salary) should be close to 1 
            let aInsight = (a.points+a.floor+a.ceiling)/3 / (a.salary/1000 * a.rank / a.tier) 
            let bInsight = (b.points+b.floor+b.ceiling)/3 / (b.salary/1000 * b.rank / b.tier) 
            let insight = aInsight - bInsight;
            return insight;
        }
        
    }).slice(0, 6)
    insightArr.splice(0, 1);
    let insightOutput = '';
    insightOutput += "<ul>"
    insightArr.forEach(el=>{
        insightOutput += `<li class='player player-${el.id}'>Name: ${el.name} - Salary: $${el.salary} -  
        Points: ${el.points} pts - Avg Type: ${el.avg_type} -
        Floor: ${el.floor} pts - Ceiling: ${el.ceiling} pts - Tier: ${el.tier} -
        Position Rank: ${el.pos_rank} - Team: ${el.team} - Game: ${el.game}</li>`
        insightOutput += "<hr>"
    })
    insightOutput += "</ul>"
    // render insight list
    $("#top-5-insight").html(insightOutput);
}

function renderDashboardPlayerList(position){
    // console.log(position)     
    // console.log(projections)     
    // console.log(salaries)     
    let filterProjections;
    let filterSalaries;
    if (position !== 'FLEX'){
		filterProjections = projections.filter(obj=>{
            return (obj.pos === position && obj.avg_type === avg);
        });
        
        filterSalaries = salaries.filter(obj=>{
            return obj.Position === position;
        });
    } else {
		filterProjections = projections.filter(obj=>{
            return (obj.pos === 'TE' && obj.avg_type === avg || obj.pos === 'WR' && obj.avg_type === avg || 
            obj.pos === 'RB' && obj.avg_type === avg);
        });
        
        filterSalaries = salaries.filter(obj=>{
            return (obj.Position === 'TE' || obj.Position === 'RB' || obj.Position === 'WR');
        });
    }

    // create and clear render array every time function is called
    let renderArr = [];
    //combine the objects from the arrays; may move this to server side
    filterProjections.forEach(player=>{
        let name = `${player.first_name} ${player.last_name}`
        // console.log(name)
        for (let el in filterSalaries){
            // console.log(filterSalaries[el].Name)
            if (name === filterSalaries[el].Name){
                let points = Math.round(player.points);
                let team = filterSalaries[el].TeamAbbrev;
                let floor = Math.round(player.floor);
                let ceiling = Math.round(player.ceiling);
                let pos_rank = player.pos_rank;
                let id = player.id;
                let tier = player.tier;
                let avg_type = player.avg_type;
                let salary = filterSalaries[el].Salary; 
                let game = filterSalaries[el]['Game Info']; 
                let obj = {
                    name,
                    points,
                    salary,
                    avg_type, 
                    floor, 
                    ceiling, 
                    tier, 
                    pos_rank, 
                    team, 
                    game,
                    id
                }
                
                renderArr.push(obj) 
                
                // console.log(str)
            }
        }
    })
    // console.log(renderArr);
    
    
    // clear out html outputs
    $("#dashboard-player-list").html('');
    $("#top-5-points").html('');
    $("#top-5-floor").html('');
    $("#top-5-ceiling").html('');
    $("#top-5-value").html('');
    $("#top-5-insight").html('');
    
    getPlayerList(renderArr)
    getTopFivePoints(renderArr)
    getTopFiveFloor(renderArr)
    getTopFiveCeiling(renderArr)
    getTopFiveValue(renderArr)
    getTopFiveInsight(renderArr)
}

function handlePlayerClick(event){
    // console.log(event.target);
    console.log(event.target.outerText)
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

//checking on blur for duplicate emails
$("#create-email").blur(function (event) {
    event.preventDefault();
    let inputEmail = $("#create-email").val();
    checkEmailExists(inputEmail);
});

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

// user is in dashboard, checking out different positions
$('.dashboard-select').on("change", function(e){
    let period = {};
    e.preventDefault();
    e.stopPropagation();
    // get value
    let query = $('#dashboard-position-select').val();
    let season = $('#dashboard-season-select').val();
    let week = $('#dashboard-week-select').val();
    let average = $('#dashboard-average-select').val();
    // validate (make sure it's not first option)
    if (query === "select" || season === "select" || week === "select" || average === "select"){
        return false;
    }
    // send to ajax call functions
    else {
        period = {
            season: Number(season),
            week: Number(week)
        }
        console.log(period)
        position = query.toString();
        avg = average.toString();
        //functions run in sequence as callbacks, starting with this one:
        getProjections(period);
    }
})

$('.single-tab').on('click', function(e){
    e.preventDefault();
    $('.single-tab').removeClass('active');
    let query = e.currentTarget.className.split(' ').pop();
    $(`a.${query}`).addClass('active');
    $(`div.top-5`).addClass('hidden');
    $(`div.${query}`).removeClass('hidden');
})

