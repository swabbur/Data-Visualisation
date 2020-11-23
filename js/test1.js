
$(document).ready(function() {
    $('.js-example-basic-multiple').select2({
        minimumInputLength: 2,
        tags: [],
        ajax: {
            url: 'option.json',
            dataType: 'json',
            type: "GET",
            quietMillis: 50,
            data: function (term) {
                return {
                    term: term
                };
            },
            results: function (data) {
                return {
                    results: $.map(data, function (item) {
                        return {
                            text: results.text,
                            //slug: item.slug,
                            id: results.id
                        }
                    })
                };
            }
        },
        matcher: function(params, data) {
            // If there are no search terms, return all of the data
            console.log(params)
            if ($.trim(params.term) === '') { return data; }
    
            // Do not display the item if there is no 'text' property
            if (typeof data.text === 'undefined') { return null; }
    
            // `params.term` is the user's search term
            // `data.id` should be checked against
            // `data.text` should be checked against
            var q = params.term.toLowerCase();
            if (data.text.toLowerCase().indexOf(q) > -1 || data.id.toLowerCase().indexOf(q) > -1) {
                return $.extend({}, data, true);
            }
    
            // Return `null` if the term should not be displayed
            return null;
        }
    });

    $('.js-example-basic-multiple').on('change', function (evt) {
        const a=$('.js-example-basic-multiple').select2('data')
        if(typeof a[0]!='undefined')
            console.log(a[0].text)
      });
    
});
