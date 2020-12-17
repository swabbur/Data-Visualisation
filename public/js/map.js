var width = 720;
var height = 960;


// Create SVG

function reset() {
    d3.selectAll('.gemeente').attr("visibility", "visible")
    d3.selectAll('.buurt').attr("visibility", "hidden")
    d3.selectAll(path).transition().style("fill", null);
    svg.transition().call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
}

const svg = d3.select("#map").append("svg")
    .on("click", reset);

const group = svg.append("g");

const projection = d3.geoAlbers()
    .rotate([0, 0])
    .parallels([40, 50])

const path = d3.geoPath()
    .projection(projection);



// Add resizing

function resize_map(width, height) {
    width = width;
    height = height;
    svg.attr("viewBox", [0, 0, width, height]);
}



// Add zoom functionality

function zoomed(event) {

    if (d3.zoomTransform(this).k < 5.5) {
        d3.selectAll('.gemeente')
            .attr("visibility", "visible")
        d3.selectAll('.buurt')
            .attr("visibility", "hidden")
    } else if (d3.zoomTransform(this).k >= 7.5) {
        d3.selectAll('.gemeente')
            .attr("visibility", "hidden")
        d3.selectAll('.buurt')
            .attr("visibility", "visible")
    }

    const { transform } = event;
    group.attr("transform", transform);
    group.attr("stroke-width", 1 / transform.k);
}

const zoom = d3.zoom()
    .scaleExtent([1, 30])
    .on("zoom", zoomed);

svg.call(zoom);



// Load data and perform first update

function clicked(event, d) {

    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();

    // township.attr('display','block')
    // states = township

    d3.select(this)
        .transition()
        .style("fill", "null")
        .on("end", () => {

            // a = d.properties.FID
            // d3.select("svg").remove();
            // console.log(d3.selectAll('g'))

            if (d.properties.rubriek == "gemeente") {
                d3.selectAll('.buurt')
                    .attr("visibility", "visible")
                d3.selectAll('.gemeente')
                    .attr("visibility", "hidden")
            } else {
                d3.selectAll('.gemeente')
                    .attr("visibility", "visible")
                d3.selectAll('.provinces')
                    .attr("visibility", "hidden")

            }

            // console.log(d.properties.name)
            // let a=d.properties.name
            // console.log(d3.selectAll('.region').style('display'))
            // if(d3.zoomTransform(this)>1){
            // d3.selectAll('.township').attr("visibility", "visible")
            // d3.selectAll('.region').attr("visibility", "hidden")
            // }

            // township.attr('display','block')
            // d3.select('#'+a).style('display','none'  )
            // d3.selectAll("path").style('display', function(d){ 
            //     var currentID = d3.select(this).attr('id');
            //       return currentID ===a ? 'block' : 'none'
            //     })
        });

    const zoomIdentity = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(40, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().call(
        zoom.transform,
        zoomIdentity
    );
}

function update() {

    projection.fitExtent([[0, 0], [width, height]], topojson.feature(files[0], files[0].objects.gemeente_2019))

    function handlemouseover(a, b) {
        const hover_color = d3.interpolateMagma(0.5)
        d3.select(this)
            .transition()
            .style("fill", d3.color("white"));
    }

    function handlemouseout(a, b) {
        d3.select(this)
            .transition()
            .style("fill", d3.interpolateMagma(0.5));
    }

    let gemeente = group.append("g")
        .attr("class", "gemeente")
        .attr("fill", d3.interpolateMagma(0.5))
        .attr('stroke', 'black')
        .attr("cursor", "pointer")

        .selectAll("path")
        .data(topojson.feature(files[0], files[0].objects.gemeente_2019).features)
        .join("path")
        .on("click", clicked)
        .on("mouseover", handlemouseover)
        .on("mouseout", handlemouseout)
        .attr("d", path)
        .attr("id", (d) => {
            return d.properties.FID
        });
    
    gemeente.append("title")
        .text(d => d.properties.statnaam);

    let buurt = group.append("g")
        .attr('visibility', 'hidden')
        .attr("class", "buurt")
        .attr("fill", d3.interpolateMagma(0.5))
        .attr('stroke', 'black')
        .attr("cursor", "pointer")
        .selectAll("path")
        .data(topojson.feature(files[1], files[1].objects.buurt_2019).features)
        .join("path")
        .on("click", clicked)
        .on("mouseover", handlemouseover)
        .on("mouseout", handlemouseout)
        .attr("d", path)
        .attr("id", (d) => {
            return d.properties.FID
        });
    
    buurt.append("title")
        .text(d => d.properties.statnaam);
};

const promises = [
    d3.json("https://cartomap.github.io/nl/wgs84/gemeente_2019.topojson"),
    d3.json("data/geo.json")
]

d3.json("data/split/84583NED_84718NED/NL00.json")
    .then(municipalities => {
        console.log(municipalities);
    });

var files = [];
Promise.all(promises)
    .then(downloads => {
        files = downloads;
        update();
    });
