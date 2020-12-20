export class Radar{
    constructor(){
        this.data=[0,0,0,0,0];
    }
    setData(data){
        this.data=data
    }
    draw() {
    var canvas = $("#radarChart");
    var radar = new Chart(canvas, {
    type: 'radar', 
    
    data: {
      labels: ["Price", "Urbanity", "Health Care", "Education", "Public Transport"],
      datasets: [{
        label: 'Preference',
        data: this.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)'
        ]
      }]
    },
    options: {
      tooltips: {enabled: false},
    hover: {mode: null},
      tooltips: {
        enabled: false
      },
      legend: {
        position: "bottom",
        display: false
    },
      scale: {
        ticks: {
            display: false
        },
        pointLabels :{
          fontStyle: "bold",
       }
    },
    
    }
  });

      }
}