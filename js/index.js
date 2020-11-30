var files = ["https://www.webuildinternet.com/articles/2015-07-19-geojson-data-of-the-netherlands/provinces.geojson",
 "https://www.webuildinternet.com/articles/2015-07-19-geojson-data-of-the-netherlands/townships.geojson"];
var promises = [];

files.forEach(function(url) {
    promises.push(d3.json(url))
});

// .then(function(values) {
//     console.log(values)
// });


Promise.all(promises)
    .then((data)=>{ 
// console.log(data)
const width = 1080 ;
  const height = 720;
  var albersProjection = d3.geoAlbers()
        .scale(8000)
        .center([0,51])
        .rotate([-4.8, 0])
        .translate( [width/2,height/2] );   
  var path = d3.geoPath()
        .projection( albersProjection );    
        // console.log(data)
        

  const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);

  const svg = d3.select("body").append("svg")   
      .attr("viewBox", [0, 0, width, height])
      .on("click", reset);

  const g = svg.append("g");

  let states = g.append("g")
  .attr("class","region")
      .attr("fill", "grey")
      .attr("cursor", "pointer")
    .selectAll("path")
    .data(data[0].features)
    .join("path")
      .on("click", clicked)
      .attr("d", path)
      .attr("id",(d)=>{
          return d.properties.name
      });

      let township=g.append("g")
      .attr("stroke", "black")
          .attr('visibility','hidden')
          .attr("fill", "#DEB887")
          .attr("cursor", "pointer")
        .selectAll("region")
        .data(data[1].features)
        .join("path")
          .on("click", clicked)
          .attr("d", path)
          .attr("id",(d)=>{
              return d.properties.name
          })
          .attr("class","township");
      
  
     
      
  township.append("title")
  .text(d => d.properties.name);

  states.append("title")
      .text(d => d.properties.name);

//   g.append("path")
//       .attr("fill", "none")
//       .attr("stroke", "white")
//       .attr("stroke-linejoin", "round")
//       .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

  svg.call(zoom);

  function reset() {
    d3.selectAll('.region').attr("visibility", "visible")
    d3.selectAll('.township').attr("visibility", "hidden")
    states.transition().style("fill", null);
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
  }

  function clicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    event.stopPropagation();
    // township.attr('display','block')
    // states=township
    states.transition().style("fill", null);

    // console.log(d)

    d3.select(this).transition().style("fill", "null")
    .on("end", ()=>{
        console.log(d.properties.name)
        let a=d.properties.name
        // console.log(d3.selectAll('.region').style('display'))
        d3.selectAll('.township').attr("visibility", "visible")
        d3.selectAll('.region').attr("visibility", "hidden")
        // township.attr('display','block')
        // d3.select('#'+a).style('display','none'  )
        // d3.selectAll("path").style('display', function(d){ 
        //     var currentID = d3.select(this).attr('id');
        //       return currentID ===a ? 'block' : 'none'
        //     })
            
        
    });
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(5, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.pointer(event, svg.node())
    );
  }

  function zoomed(event) {
    // console.log(d3.zoomIdentity.k)
    const {transform} = event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }
       
});
    // svg.append("path")
    //     .datum({type: "FeatureCollection", features: 'netherlands.json'})
    //     .attr("d", d3.geoPath());
   
    // svg.selectAll("path")
    //   .data(json)
    //   .enter().append("path")
    //     .attr("d", d3.geoPath());
  
    