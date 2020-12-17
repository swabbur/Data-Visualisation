export class Options {
    
    constructor(
        preferences_table, 
        requirements_table, 
        preferences,
        requirements, 
        callback
    ) {
        function inner_callback() {
            callback(
                preferences.map(preference => $("#" + preference).val()),
                requirements.map(requirement => $("#" + requirement).val())
            );
        }
    
        preferences.forEach(preference => {
            preferences_table.append(create_row([
                create_label(preference), 
                create_slider(preference, inner_callback),
            ]));
        });
    
        requirements.forEach(requirement => {
            requirements_table.append(create_row([
                create_checkbox(requirement, inner_callback),
                create_label(requirement),
            ]));
        });
    
        inner_callback();
    }
}

function create_row(elements) {
    const row = $("<tr>");
    elements.forEach(element => row.append($("<td>").append(element)));
    return row
}

function create_label(identifier) {
    const words = identifier.split("_");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    const title = words.join(" ");
    return $("<label>").text(title);
}

function create_slider(identifier, callback) {
    return $("<input>")
        .attr("id", identifier)
        .attr("type", "range")
        .attr("min", 0.0)
        .attr("max", 1.0)
        .attr("step", 0.1)
        .attr("value", 0.5)
        .change(callback);
}

function create_checkbox(identifier, callback) {
    return $("<input>")
    .attr("id", identifier)
    .attr("type", "checkbox")
    .change(callback);
}
