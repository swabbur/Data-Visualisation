let data;
$.getJSON("file.json", function(json) {
    data=json
});

$(document).ready(function() {
    console.log(data)
    $('.js-example-basic-multiple').select2({
        placeholder: 'Select allowed countries',
        data:data.results
    });

    $('.js-example-basic-multiple').on('change', function (evt) {
        const a=$('.js-example-basic-multiple').select2('data')
        if(typeof a[0]!='undefined')
            console.log(a[0].text)
      });
    
});
