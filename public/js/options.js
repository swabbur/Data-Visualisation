function create_label(identifier) {
    const words = identifier.split("_");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    const title = words.join(" ");
    return $("<label>").text(title);
}

function create_slider(identifier) {
    return $("<input>")
        .attr("id", identifier + "_slider")
        .attr("type", "range")
        .attr("min", 0.0)
        .attr("max", 1.0)
        .attr("step", 0.1)
        .attr("value", 0.5);
}

function create_checkbox(identifier) {
    return $("<input>")
        .attr("id", identifier + "_checkbox")
        .attr("type", "checkbox");
}

function create_row(elements) {
    const row = $("<tr>");
    elements.forEach(element => row.append($("<td>").append(element)));
    return row
}
