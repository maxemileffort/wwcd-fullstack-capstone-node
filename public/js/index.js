
//=======================
// Function Declarations
//=======================

function getStats(season, week){
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
        $('.results').html(`<p>Finished updating DB.</p>`)
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

$('.admin-submit').on('click', function(){
    let season = $('#season').val()
    let week = $('#week').val()
    getStats(season, week)
})