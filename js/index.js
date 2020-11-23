
$(document).ready(function() {
    $('.js-example-basic-multiple').select2({
        minimumInputLength: 3,
        ajax: {
            url: 'http://localhost:3000/',
            dataType: 'json',
            type: "GET",
            quietMillis: 50,
            data: function (term) {
                return term;
            },
            processResults: function (data) {
                //console.log(data.results)
                return {
                    results: $.map(data.results, function (item) {
                        return {
                            text: item.text,
                            slug: item.slug,
                            id: item.id
                        }
                    })
                };
            }
        },
        
    });

    // $('.js-example-basic-multiple').on('change', function (evt) {
    //     const a=$('.js-example-basic-multiple').select2('data')
    //     if(typeof a[0]!='undefined')
    //         console.log(a)
    //   });
    
});
