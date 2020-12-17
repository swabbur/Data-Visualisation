export class Options {
    
    constructor(
        preferences,
        requirements, 
        callback
    ) {

        for (const preference in preferences) {
            $("#preferences").append(create_row([
                create_label(preference), 
                create_slider(preference, preferences[preference], () => {
                    preferences[preference] = parseFloat($("#" + preference).val());
                    callback();
                }),
            ]));
        }

        for (const requirement in requirements) {
            $("#requirements").append(create_row([
                create_checkbox(requirement, requirements[requirement], () => {
                    requirements[requirement] = $("#" + requirement).prop('checked');
                    callback();
                }),
                create_label(requirement),
            ]));
        }
    }
}

function create_row(elements) {
    const row = $("<tr>");
    elements.forEach(element => {
        const data = create_data(element);
        row.append(data);
    });
    return row
}

function create_label(identifier) {
    const title = create_title(identifier);
    return $("<label>")
        .text(title);
}

function create_slider(identifier, value, callback) {
    return $("<input>")
        .attr("id", identifier)
        .attr("type", "range")
        .attr("min", 0.0)
        .attr("max", 1.0)
        .attr("step", 0.1)
        .attr("value", value)
        .change(callback);
}

function create_checkbox(identifier, value, callback) {
    return $("<input>")
        .attr("id", identifier)
        .attr("type", "checkbox")
        .attr("checked", value)
        .change(callback);
}

function create_data(element) {
    return $("<td>")
        .append(element);
}

function create_title(identifier) {
    const words = identifier.split("_");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(" ");
}