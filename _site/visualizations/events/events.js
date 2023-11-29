// **** Your JavaScript code goes here ****

var xoffset =30;
var homecolor = '#800020';
var awaycolor = '#03459C';
var selected_events = ['goal'];

var selected_gid = -1;
var game_to_id = {};

const svgContainer = d3.select('.event-div').append('svg')
    .attr('width', 1500)
    .attr('height', 800)
    .attr('top', 1000)
    .attr('left', 30);


d3.csv('./visualizations/events/summary.csv').then(function(dataset) {
    var searchItems = document.getElementById("itemDropdownEvents");  
    dataset.forEach(function(d) {
        var listItem = document.createElement("li");
        listItem.textContent = d.desc;
        listItem.setAttribute("data-item", d.desc);
        searchItems.appendChild(listItem);
        game_to_id[d.desc] = d.gid;
    });
    
    var selectedItems = new Set();
    document.getElementById('searchInputEvents').addEventListener('input', function(event) {
        var searchTerm = event.target.value.toLowerCase();
        var items = document.querySelectorAll('#itemDropdownEvents li');
        document.getElementById('itemDropdownEvents').style.display = searchTerm.length >= 2 ? 'block' : 'none';
        items.forEach(function(item) {
            var itemName = item.dataset.item.toLowerCase();
            var display = itemName.includes(searchTerm) ? 'block' : 'none';
            item.style.display = display;
        });
    });

    var dropdownItems = document.querySelectorAll('#itemDropdownEvents li');

    dropdownItems.forEach(function(item) {
    item.addEventListener('click', function() {
        var itemName = item.dataset.item;
        updateGame(itemName);
        document.getElementById('searchInputEvents').value = '';
        document.getElementById('itemDropdownEvents').style.display = 'none';
        });
    });

    document.getElementById('searchInputEvents').addEventListener('focus', function() {
    var searchTerm = this.value.toLowerCase();
    document.getElementById('itemDropdownEvents').style.display = searchTerm.length >= 2 ? 'block' : 'none';
    });

    document.getElementById('searchInputEvents').addEventListener('blur', function() {
    setTimeout(function() {
        document.getElementById('itemDropdownEvents').style.display = 'none';
    }, 200);
    });
});

function parseGameDesc(input) {
    var regex = /(.+)\((\d+)\)\s*-\s*(.+)\((\d+)\)/;
    var match = input.match(regex);
    var team1 = match[1].trim();
    var g1 = match[2];
    var team2 = match[3].trim();
    var g2 = match[4];
    return {'team1': team1, 'team2': team2, 'result': g1 + ' - ' + g2};
}
function updateGame(gameDesc) {
    var parsedDesc = parseGameDesc(gameDesc);
    document.getElementById("team1").innerText = parsedDesc.team1;
    document.getElementById("team2").innerText = parsedDesc.team2;
    document.getElementById("scoreboard").innerText = parsedDesc.result;
    console.log(parsedDesc);
    selected_gid = game_to_id[gameDesc];
    selected_events = ['goal'];
    updateEvents();
}


function getIconAddress(d) {
    if (d.event == 'goal')
        return "./visualizations/events/assets/soccer-ball.png";
    else if (d.event == 'yellow card')
        return "./visualizations/events/assets/yellow-card.png";
    else if (d.event == 'red card')
        return "./visualizations/events/assets/red-card.png";
    else if (d.event == 'offside')
        return "./visualizations/events/assets/offside.png";
    else if (d.event == 'corner')
        return "./visualizations/events/assets/corner.png";
    else if (d.event == 'substitution')
        return "./visualizations/events/assets/substitution.png";
    
    return "";
}


function updateChosenEvents()
{ 
    var checkboxes = document.getElementById("checkboxForm");  
    selected_events = [];

    for(var i = 0; i < checkboxes.length; i++)  
        if(checkboxes[i].checked)
            selected_events.push(checkboxes[i].value);
    
    console.log(selected_events);
    updateEvents();
}

function updateEvents() {
    d3.csv('./visualizations/events/events.csv').then(function(dataset) {  
        var filtered_data = dataset.filter(d => selected_events.includes(d.event) && d.gid == selected_gid);
        showEvents(filtered_data)
    });
}

function handleMouseOver(text) {
    console.log(text);
    document.getElementById("eventReport").innerText = text;
}

function showEvents(dataset) {
    svgContainer.selectAll('.icon').remove();
    svgContainer.selectAll('rect').remove();

    var icons = svgContainer.selectAll('.icon').data(dataset)

    
    var iconsEnter = icons.enter()
    .append('g')
    .attr('class', 'icon')
    .attr('transform', function(d) {
        var tx = d.minute * 15 + xoffset - 10;
        var ty = (d.team == '0')? 525: 625;
        return 'translate('+[tx, ty]+')';
    });
    iconsEnter.append('text')
    .attr('y', function(d) {
        return (d.team == '0')? -12: 42;
    })
    .attr('x', function(d) {
        return -d.minute * 15 + 50;
    })
    .attr('text-anchor', 'left')
    .attr('alignment-baseline', 'left')
    .attr('fill', 'white')
    .attr('font-family', "'PT Sans', sans-serif")
    .attr('font-size', '14')
    .text(function(d) {
        return d.minute + "' : " + d.description;
    });

    // iconsEnter.append('div')
    // .attr('style', "background-color: #3498db; color: white; padding: 10px;")



    svgContainer.selectAll('rect')
    .data(dataset)
    .enter().append('rect')
    .attr('y', (d) => (d.team == '0')? 550: 590)
    .attr('x', (d) => d.minute * 15 + xoffset - 1)
    .attr('width', 3)
    .attr('height', 30)
    .style('fill', (d) => (d.team === '0') ? homecolor : awaycolor);

    
    iconsEnter.append('rect') // Add a rectangle for the background color
        .attr('width', 28)
        .attr('height', 28)
        .attr('rx', 5) // Set the horizontal corner radius
        .attr('ry', 5) // Set the vertical corner radius
        .attr('fill', 'rgb(230, 230, 230, 0.5)') // Set your desired background color here
        .attr('transform', 'translate(-4, -4)'); // Move the rect 5 pixels to the top and left


    iconsEnter.append('image')
        .attr('width', 20)
        .attr('href', (d) => getIconAddress(d))
    
    
    // svgContainer.selectAll('text')
    // .data(dataset)
    // .enter().append('text')
    // .attr('x', (d) => d.minute * 15 + xoffset)
    // .attr('y', 660)
    // .attr('text-anchor', 'middle')
    // .text((d) => d.description);

}