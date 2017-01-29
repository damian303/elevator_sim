start();
function start(){
  var lift =[];
  var person = [];
  var amount_of_lifts = 3;
  var amount_of_floors = 20;
  var time_period = 100;
  var name = 0;
  var pause = false;
  /* setup table for display */
  var table="<table><tr><td>"
  for(var l = 1; l<=amount_of_lifts; l++){
    table+="<td class='info' id='info_lift_"+l+"'></td>";
  }
  table+="<td>";
  for(var floor = amount_of_floors; floor>0; floor--){
    table+="<tr><td class='numbers'>"+floor+"</td>";
      for(var l = 1; l<=amount_of_lifts; l++){
        table+="<td class='floor lift"+l+"' id='floor_"+floor+"_lift_"+l+"'></td>";
      }
    table+="</tr>";
  }
  table+="</table>";
  d3.select("#lift_table").html(table);
  /* setup pause button */
  d3.select("#pause").html("PAUSE").on("click", function(){
    if(pause===true){
      d3.select("#pause").html("PAUSE")
      pause = false;
      timeLoop();
    }
    else{
      pause = true;
      d3.select("#pause").html("PLAY");
    }
  })
  /* Set up the person array */
  for(var i = 0; i< time_period;i++)
  {
    // get a random number
    var rand = Math.floor((Math.random() * 100) + 1); // This is used to decide if there is a lift call at a specific time slot
    if(rand>80){// 20% chance of a lift call
      var obj = {};
      obj.time = i;
      obj.name = "Person_"+name;
      obj.start = Math.floor((Math.random() * amount_of_floors) + 1);
      obj.dest = obj.start;
      while(obj.dest==obj.start){
        obj.dest = Math.floor((Math.random() * amount_of_floors) + 1);
      }
      if(obj.dest < obj.start)obj.direction = -1;
      else obj.direction = 1;
      obj.waiting = 0; obj.trip_time = 0;
      person[i]=obj;
      name++;
    }
  }

  /* set up the lifts on random floors to start */
  for (var l = 0; l < amount_of_lifts; l++){
    var obj = {};
    obj.name = l+1;
    obj.floor = Math.floor((Math.random() * amount_of_floors) + 1);
    obj.direction = 0;
    obj.destinations = [];
    obj.passengers = [];
    obj.score = 0;
    lift[l] = obj;
    d3.select("#floor_"+obj.floor+"_lift_"+obj.name).style("background", "red");
  }

  var time = 0;
  timeLoop();
  function timeLoop () {//  create a loop function
      if(person[time]){// We have a button pressed
        assign_lift(time);
      }
      // Move the lifts towards their destinations
      for(var l = 0; l < lift.length; l++){
        if(lift[l].destinations.length>0){// Does the lift have a destination?
          var stop = lift[l].destinations.indexOf(lift[l].floor);
          if(stop===-1){// This floor is not in our destination list
            if(lift[l].destinations[0] < lift[l].floor)lift[l].direction = -1;
            else lift[l].direction = 1;
            if(lift[l].floor<=amount_of_floors && lift[l].floor>0){
              lift[l].floor+=lift[l].direction;
            }
            //console.log("Lift "+lift[l].name+" direction = "+lift[l].direction);
          }else{
            // Lift arrives at floor
            //console.log("Lift "+lift[l].name+" arrived at floor "+lift[l].floor);
            // Remove the floor from the destination list.
            lift[l].destinations = lift[l].destinations.filter(function(floor){return floor !== lift[l].floor;});
            // If there are no more destinations change to direction 0 //
            if(lift[l].destinations.length===0){
              lift[l].direction = 0;
            }
            // Check for person waiting
            person.forEach(function(p) {
              if(p.start==lift[l].floor&& p.time<=time){// Picking up person
                lift[l].passengers.push(p);
                lift[l].destinations.push(p.dest);
                p.start = null;
                p.waiting = time - p.time;// Calculate waiting for lift time
                d3.select("#floor_"+lift[l].floor+"_lift_"+lift[l].name).html("");
              }else if(p.dest==lift[l].floor&& p.time<=time){// Drop off a person
                p.trip_time = time - p.time - p.waiting;// Calculate waiting time
              }
            });
            // Check for passenger looking to get off.
            // Remove passengers from lift //
            lift[l].passengers.forEach(function(passenger){
              if( passenger.dest === lift[l].floor){name--;}
            })
            lift[l].passengers= lift[l].passengers.filter(function(passenger){return passenger.dest !== lift[l].floor;});
          }
          update_display();
        }
      }

      setTimeout(function () {    //
        time++;                     //  increment the time
         d3.select("#time").html("Time : "+time+". "+(name)+" people left.");
         if (name>0 && time<200) {//prevent it running forever!
            if(!pause)timeLoop();
         }else{
           var avg_wait = 0, avg_trip = 0, i=0;
           person.forEach(function(p){
             avg_wait+=p.waiting;
             avg_trip+=p.trip_time;
             i++;
           });
           avg_wait = (avg_wait / i);
           avg_trip = (avg_trip / i);
           console.log("Average wait : "+ avg_wait);
           console.log("Average trip time : "+ avg_trip);
           d3.select("#time").html("Time : "+time+". Average wait time : "+avg_wait.toFixed(2));
           d3.select("#pause").html("RESTART").on("click", function(){start();});
           update_display();
         }
      }, 200)
  }

  function assign_lift(time){
    // Choose a lift by calculating its score ;
    for(var l = 0; l < lift.length; l++){
      // The basis for the score is the distance
      lift[l].score = Math.abs(lift[l].floor - person[time].start);
      // Is the lift going the same direction?
      if(lift[l].direction === person[time].direction || lift[l].direction===0){
          // Is the call between the lift and its destination ?
          // New choosing algorithm //
          if(lift[l].direction === -1){// Lift going down
          		// Check is the destination in between the lift and its next destination. //
              if(lift[l].destinations[0] < person[time].start && lift[l].floor > person[time].start){lift[l].score-=10}
          }else if(lift[l].direction === 1){// Lift going up
              if(lift[l].destinations[0] > person[time].start && lift[l].floor < person[time].start){lift[l].score=-10}
          }else{// Lift not moving
            lift[l].score-=20;
          }
      }
    }
    // Sort the lifts by their score descending
    lift = lift.sort(function(a, b) { return a.score - b.score; });
    // The first lift gets the call //
    lift[0].destinations.push(person[time].start);
  }

  function update_display(){
    for(var l = 0; l< lift.length; l++){
      var dest_str = "";
      //reset the lift cells
      d3.selectAll(".lift"+lift[l].name).style("background", "white").html("");
      //Update the graphic
      lift[l].destinations.forEach(function(dest){
        d3.select("#floor_"+dest+"_lift_"+lift[l].name).style("background", "#DFE6E8");//.html(lift[l].passengers.length);
        dest_str+=dest+", ";
      })
      d3.select("#floor_"+lift[l].floor+"_lift_"+lift[l].name).style("background", "red").html(lift[l].passengers.length);
      var direction = ""
      if(lift[l].direction>0)direction = "Going up. ";
      else if(lift[l].direction<0) direction = "Going down. "
      d3.select("#info_lift_"+lift[l].name).html("Floor: "+lift[l].floor+".\n "+direction+"\nDest: "+dest_str);
    }
  }
}
