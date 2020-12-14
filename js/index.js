const width = 1600 ;
const height = 900;
var promises = [];
var files = [
//"https://cartomap.github.io/nl/wgs84/provincie_2019.topojson",
"https://cartomap.github.io/nl/wgs84/gemeente_2019.topojson",
"buurt.json"
]

function reset() {
    // d3.selectAll('.provinces').attr("visibility", "visible")
    d3.selectAll('.gemeente').attr("visibility", "visible")
    d3.selectAll('.buurt').attr("visibility", "hidden")
    d3.selectAll(path).transition().style("fill", null);
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
  }

  
const svg = d3.select("body").append("svg")   
    .attr("viewBox", [0, 0, width, height])
    .on("click", reset);
    
const g = svg.append("g");

const albersProjection = d3.geoAlbers()
    .rotate([0, 0])
    .parallels([40, 50])

const path = d3.geoPath()
 .projection( albersProjection );


files.forEach(function(url) {
    promises.push(d3.json(url))
}); 


Promise.all(promises)
.then(function(topology) {
    albersProjection
    .fitExtent([[0, 0], [width, height]], topojson.feature(topology[0], topology[0].objects.gemeente_2019))
function handlemouseover(a,b){
  d3.select(this).transition().style("fill", "red");
}
  
function handlemouseout(a,b){
  d3.select(this).transition().style("fill", "white");
}

//  let provinces = g.append("g")
//   .attr("class","provinces")
//   .attr('visibility','hidden')
//       .attr("fill", "white")
//       .attr("stroke","black")
//       .attr("cursor", "pointer")
  
//     .selectAll("path")
//     .data(topojson.feature(topology[0], topology[0].objects.provincie_2019).features)
//     .join("path")
//       .on("click", clicked)
//       .on("mouseover",handlemouseover)
//       .on("mouseout",handlemouseout)
//       .attr("d", path)
//      .attr("id",(d)=>{
//         //  console.log(d)
//          return d.properties.FID
//      });
     
    //  provinces.append("title")
    //  .text(d => d.properties.statnaam);

let gemeente = g.append("g")
// .attr('visibility','hidden')
            .attr("class","gemeente")
         .attr("fill", "white")
         .attr('stroke','black')
         .attr("cursor", "pointer")
         
       .selectAll("path")
       .data(topojson.feature(topology[0], topology[0].objects.gemeente_2019).features)
       .join("path")
         .on("click", clicked)
         .on("mouseover",handlemouseover)
      .on("mouseout",handlemouseout)
         .attr("d", path)
        .attr("id",(d)=>{
            return d.properties.FID
        });
        gemeente.append("title")
        .text(d => d.properties.statnaam);

let buurt = g.append("g")
.attr('visibility','hidden')
        .attr("class","buurt")
            .attr("fill", "white")
            
            .attr('stroke','black')
            .attr("cursor", "pointer")
          .selectAll("path")
          .data(topojson.feature(topology[1], topology[1].objects.buurt_2019).features)
          .join("path")
            .on("click", clicked)
            .on("mouseover",handlemouseover)
      .on("mouseout",handlemouseout)
            .attr("d", path)
           .attr("id",(d)=>{
               return d.properties.FID
           });
           buurt.append("title")
           .text(d => d.properties.statnaam);   

});



const zoom = d3.zoom()
.scaleExtent([1, 30])
.on("zoom", zoomed);

function zoomed(event) {
  
    console.log(event)
    // if(d3.zoomTransform(this).k<2.5){
    //   console.log('p')
    //   // d3.selectAll('.gementee').attr("visibility", "visible")
    //   d3.selectAll('.provinces')
    //   .attr("visibility", "visible")
    //   d3.selectAll('.gemeente')
    //   .attr("visibility", "hidden")
    //   d3.selectAll('.buurt')
    //   .attr("visibility", "hidden")
    // }
    if (d3.zoomTransform(this).k<5.5){
      // d3.selectAll('.provinces')
      // .attr("visibility", "hidden")
      d3.selectAll('.gemeente')
      .attr("visibility", "visible")
      d3.selectAll('.buurt')
      .attr("visibility", "hidden")
    }
    else if (d3.zoomTransform(this).k>=7.5){
      // d3.selectAll('.provinces')
      // .attr("visibility", "hidden")
      d3.selectAll('.gemeente')
      .attr("visibility", "hidden")
      d3.selectAll('.buurt')
      .attr("visibility", "visible")
    }
    
    const {transform} = event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  function clicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    // township.attr('display','block')
    // states=township
    // console.log(event)
    // d3.selectAll('provinces').transition().style("fill", null);

    // console.log(d)

    d3.select(this).transition().style("fill", "null")
    .on("end", ()=>{
        // a=d.properties.FID
          // d3.select("svg").remove();
          // console.log(d3.selectAll('g'))
          
// console.log(this.class)
        if(d.properties.rubriek=="gemeente"){
            d3.selectAll('.buurt')
            .attr("visibility", "visible")
        d3.selectAll('.gemeente')
            .attr("visibility", "hidden")
            // d3.selectAll("#"+)
        }
        else{
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

        // console.log()
        
    });
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.min(40, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
    );
  } 
  svg.call(zoom);