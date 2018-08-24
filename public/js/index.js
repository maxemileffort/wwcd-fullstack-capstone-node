

//for opening the menu on screens smaller than 1000px
$('.toggleNav').on('click', function() {
    $('.flex-nav ul').toggleClass('open');
 });

 function getStats(season, week){
     let period = {
         season,
         week
     };
     
    $.ajax({
        type: 'POST',
        url: '/get-stats',
        dataType: 'json',
        data: JSON.stringify(period),
        contentType: 'application/json',
        timeout: 0, //server response comes at 2 min 10 sec, default timeout is 2 min
        beforeSend: function(){
            $('.results').html(`<p>Retrieving projections...</p>`)
        }
    })
        //if call succeeds
        .done(function (result) {
            console.log(result);
            $('.results').html(`<p>${result}</p>`)
        })
        //if the call fails
        .fail(function (jqXHR, error, errorThrown) {
            console.log(jqXHR);
            console.log(error);
            console.log(errorThrown);
        });
 }