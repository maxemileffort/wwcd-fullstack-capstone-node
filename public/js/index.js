
//=======================
// Function Declarations
//=======================

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
    console.log(this)
    let file = new FormData(this);
    let season = $('#season').val();
    let week = $('#week').val();
    console.log(file)
    if($("#salaries-file") === undefined || season === '' || week === ''){
        $('.results').html(`<p>All fields required</p>`);
        return false;
    } else {
       // sendStatsToDb(season, week);
        sendSalariesToDb(file);
    }
    e.stopPropagation();
})



