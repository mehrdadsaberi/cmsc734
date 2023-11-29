



function dataPreprocessorMap(row) {
    return {
        'desc': row['desc'],
        'team1': row['team1'],
        'team2': row['team2'],
        'side': row['ha'],
        'player': row['player'],
        'sx': +row['sx'],
        'sy': +row['sy'],
        'ex': +row['ex'],
        'ey': +row['ey'],
        'accurate': +row['accurate'],
        'half': +row['half'],
    };
}

var dataset_allMap;
var map_games = new Set();
var map_players = new Set();
var selectedGame = null;
var selectedPlayer = null;


d3.csv('./visualizations/map/dset.csv', dataPreprocessorMap).then(function(input_dataset) {
    dataset_allMap = input_dataset;

    dataset_allMap.forEach((d) => {
        // Assuming 'desc' is the key you want to extract
        map_games.add(d["desc"]);
    });


    prepare_searchboxMap()

})


function drawLineFirst(x1, y1, x2, y2, half, accurate, player_side) {

    var color = "blue";
    var marker = "url(#arrowhead1)";
    if (accurate == 0) {
        color = "red"; 
        marker = "url(#arrowhead0)";
    }

    let tmp = x1;
    x1 = y1;
    y1 = tmp;
    tmp = x2;
    x2 = y2;
    y2 = tmp;

    let minLeft = 109, maxLeft = 349, minTop = 70, maxTop = 410;
    if (half == 2) {
        minLeft += 421;
        maxLeft += 421;
    }

    
    if ((half == 2 && player_side == 1) || (half == 1 && player_side == 2) ) {
        x1 = 100 - x1;
        x2 = 100 - x2;
        y1 = 100 - y1;
        y2 = 100 - y2;
    }

    x1 = x1 / 100 * (maxLeft - minLeft) + minLeft;
    x2 = x2 / 100 * (maxLeft - minLeft) + minLeft;
    y1 = y1 / 100 * (maxTop - minTop) + minTop;
    y2 = y2 / 100 * (maxTop - minTop) + minTop;


    firstMap = d3.select("#firstMap").append("line")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("marker-end", marker)
        .attr("class", "lineMap");
        // .style("z-index", -100);

    // document.getElementById('firstMap').appendChild(line);
}

function showGameMap() {
    d3.selectAll('.lineMap').remove();
    dataset_allMap.forEach((d) => {
        if (d["desc"] == selectedGame && d["player"] == selectedPlayer) {
            // console.log(d["half"])
            drawLineFirst(d["sx"], d["sy"], d["ex"], d["ey"], d["half"], d["accurate"], d["side"]);
        }
    });
}


function updateSearchBoxMapPlayer() {

    var dropdownContent = document.getElementById('itemDropdownMapPlayer');

    const elements = document.getElementsByClassName("searchbox-itemMapPlayer");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }

    map_players = new Set();
    var team1_players = new Set();
    var team2_players = new Set();
    var team1Name;
    var team2Name;
    dataset_allMap.forEach((d) => {
        // Assuming 'desc' is the key you want to extract
        if (d["desc"] == selectedGame) {
            team1Name = d["team1"];
            team2Name = d["team2"];
            if (d["side"] == 1) team1_players.add(d["player"]);
            else if (d["side"] == 2) team2_players.add(d["player"]);
            map_players.add(d["player"]);
        }
    });

    let team1_players_str = "<b>" + team1Name + ":</b>  ";
    for (const value of team1_players) {
        team1_players_str += value + ",";
    }
    document.getElementById('team1Map').innerHTML = team1_players_str.slice(0, -1);

    
    let team2_players_str = "<b>" + team2Name + ":</b>  ";
    for (const value of team2_players) {
        team2_players_str += value + ",";
    }
    document.getElementById('team2Map').innerHTML = team2_players_str.slice(0, -1);

    document.getElementById('team1half1Name').innerHTML = team1Name;
    document.getElementById('team1half2Name').innerHTML = team1Name;
    document.getElementById('team2half1Name').innerHTML = team2Name;
    document.getElementById('team2half2Name').innerHTML = team2Name;


    // document.getElementById('team2Map').innerHTML = "";

    map_players.forEach(player => {
        var li = document.createElement('li');
        li.dataset.item = player;
        li.textContent = player;
        li.classList.add("searchbox-itemMapPlayer")
        li.addEventListener('click', function() {
            // addTag(player);
            // Clear the search input and hide the dropdown after selection
            document.getElementById('searchInputMapPlayer').value = '';
            document.getElementById('itemDropdownMapPlayer').style.display = 'none';
            selectedPlayer = player;
            document.getElementById('searchInputMapPlayer').placeholder = player;
            showGameMap();
        });
        dropdownContent.appendChild(li);
    });
}


function updatePlayerData() {

    document.getElementById('searchInputMapPlayer').addEventListener('input', function(event) {
        var searchTerm = event.target.value.toLowerCase();
        var items = document.querySelectorAll('#itemDropdownMapPlayer li');
  
        // Display the dropdown only when there are at least two characters in the search input
        document.getElementById('itemDropdownMapPlayer').style.display = searchTerm.length >= 1 ? 'block' : 'none';
  
        items.forEach(function(item) {
          var itemName = item.dataset.item.toLowerCase();
          var display = itemName.includes(searchTerm) ? 'block' : 'none';
          item.style.display = display;
        });
      });
  
  
      // Example usage: Add a tag when an item is selected from the dropdown
      var dropdownItems = document.querySelectorAll('#itemDropdownMapPlayer li');
  
      dropdownItems.forEach(function(item) {
        item.addEventListener('click', function() {
          var itemName = item.dataset.item;
        //   addTag(itemName);
          // Clear the search input and hide the dropdown after selection
          document.getElementById('searchInputMapPlayer').value = '';
          document.getElementById('itemDropdownMapPlayer').style.display = 'none';
        });
      });
  
      // Show/hide the dropdown based on the focus of the search input
      document.getElementById('searchInputMapPlayer').addEventListener('focus', function() {
        // Display the dropdown only when there are at least two characters in the search input
        var searchTerm = this.value.toLowerCase();
        document.getElementById('itemDropdownMapPlayer').style.display = searchTerm.length >= 1 ? 'block' : 'none';
      });
  
      document.getElementById('searchInputMapPlayer').addEventListener('blur', function() {
        // Use a timeout to allow the click event of the dropdown item to be triggered before hiding the dropdown
        setTimeout(function() {
          document.getElementById('itemDropdownMapPlayer').style.display = 'none';
        }, 200);
      });
  
      
      updateSearchBoxMapPlayer()
}


function updateSearchBoxMap() {

    var dropdownContent = document.getElementById('itemDropdownMap');

    const elements = document.getElementsByClassName("searchbox-itemMap");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }

    map_games.forEach(game => {
        var li = document.createElement('li');
        li.dataset.item = game;
        li.textContent = game;
        li.classList.add("searchbox-itemMap")
        li.addEventListener('click', function() {
            // addTag(player);
            // Clear the search input and hide the dropdown after selection
            document.getElementById('searchInputMap').value = '';
            document.getElementById('itemDropdownMap').style.display = 'none';
            selectedGame = game;
            document.getElementById('searchInputMap').placeholder = game;
            document.getElementById('searchInputMapPlayer').placeholder = "Search for players";
            updatePlayerData();
        });
        dropdownContent.appendChild(li);
    });
}



function prepare_searchboxMap() {
    // Your JavaScript code remains unchanged

    document.getElementById('searchInputMap').addEventListener('input', function(event) {
      var searchTerm = event.target.value.toLowerCase();
      var items = document.querySelectorAll('#itemDropdownMap li');

      // Display the dropdown only when there are at least two characters in the search input
      document.getElementById('itemDropdownMap').style.display = searchTerm.length >= 1 ? 'block' : 'none';

      items.forEach(function(item) {
        var itemName = item.dataset.item.toLowerCase();
        var display = itemName.includes(searchTerm) ? 'block' : 'none';
        item.style.display = display;
      });
    });


    // Example usage: Add a tag when an item is selected from the dropdown
    var dropdownItems = document.querySelectorAll('#itemDropdownMap li');

    dropdownItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var itemName = item.dataset.item;
        // addTag(itemName);
        // Clear the search input and hide the dropdown after selection
        document.getElementById('searchInputMap').value = '';
        document.getElementById('itemDropdownMap').style.display = 'none';
      });
    });

    // Show/hide the dropdown based on the focus of the search input
    document.getElementById('searchInputMap').addEventListener('focus', function() {
      // Display the dropdown only when there are at least two characters in the search input
      var searchTerm = this.value.toLowerCase();
      document.getElementById('itemDropdownMap').style.display = searchTerm.length >= 1 ? 'block' : 'none';
    });

    document.getElementById('searchInputMap').addEventListener('blur', function() {
      // Use a timeout to allow the click event of the dropdown item to be triggered before hiding the dropdown
      setTimeout(function() {
        document.getElementById('itemDropdownMap').style.display = 'none';
      }, 200);
    });

    
    updateSearchBoxMap()
}
