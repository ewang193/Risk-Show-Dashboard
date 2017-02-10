$(function () {

  //"use strict";
//Global variables to clean and address
  var prev_country = "", //contains last country object
    gprev_country = "",//contains last country
    prev_entity = "",//contains last entity clicked
    entity_count = 0, // contains number of entities in a country
    //Defined to reuse the clicked country div id
    $active_country,//contains active clicked/auto selected country
    //Defined to reuse the clicked country name
    gselected_country = "", //store current country selected
    template_arr = [],
    enable_map_rotate = 0,
    // switch_map variable to define map rending based on user action
    //0-> on load rotate globe from left to right 1-> switch country to clicked country 2-> rotate globe between all countries in the dataset
    switch_map = 0,
    //Defined to reuse the donut chart colors in different functions
    donut_color = "",
    trans_ease = "easeCubicOut",
    prev_transaction = 0, //contains entity previous total transactions
    prev_amount = 0, // contains entity previous transaction amount
    prev_transaction_per = 0, // contains entity previous transaction percentage
    prev_amount_per = 0,// contains entity previous transaction amount percentage
    entity_clear_time="";// entity summary settimeout object

  var formats = {whole: d3.format(".0f"), trunc: d3.format(".2s")}; // global number formats

  var dataFiles = {
    //all input data files
    country_data: '/data/Country_Data.json',
    entity_data: '/data/Entity_Data.json',
    messages:'/data/cerberus-messages.tsv',
    world:'/data/world-110m.json',
    world_country_name:'/data/world-country-names.tsv',
    country_name:'/data/cerberus-country-names.tsv',
    real_data:'/data/modified_data.json'};

  var country_inactive = "", //contains inactive/previous country path
    country_active = "",//contains active/current country path
    entity_inactive = "", //contains inactive/previous entity path
    entity_active = "", //contains active/current entity path
    title_arc = "", //Global title arc object in donut chart
    datasets = {country:[], entity:[], message:[]}, //Datasets
    std_rect_height=30,//Standard rectangle height
    std_font_size="16px", //standard font size
    std_time = 2000; //Standard unit of time for all actions
  std_delay_x = 300; //Standard unit of delay for individual actions
  var baseEntityData = [],ratingData = [], country_map = new Object();
  var globe_size=0, arc_base = 0,sec_B_width=0, sec_B_top=0, sec_B_left=0;// globe width
  var country_color = d3.scale.linear()
    .domain([0, 10])
    .range(["#B27F00", "#E0301E"]);

  init();

  function init() {
    eventBinding();
    load_dashboard();
  }

  var formatNumberWhole = d3.format(".0f"),
    formatNumberTenth = d3.format(".1f"),
    formatBillion = function(x) { return formatNumberTenth(x / 1e9) + "B"; },
    formatMillion = function(x) { return formatNumberTenth(x / 1e6) + "M"; },
    formatThousand = function(x) { return formatNumberTenth(x / 1e3) + "k"; },
    formatHundreds = function(x) { return formatNumberWhole; };

  function formatAbbreviation(v) {
    // var v = Math.abs;
    //console.log(v);
    return (v >= .9995e9 ? formatBillion(v)  : v >= .9995e6 ? formatMillion(v)  : v >= .9995e3 ? formatThousand(v) : formatHundreds(v));
  }



  function eventBinding() {
    var resize_obj="";
    // $(window).resize(function () {
    //     $page_height = $(window).height();
    //     $page_width = $(window).width();
    //     clearTimeout(resize_obj);
    //      resize_obj=setTimeout(function () {
    //         adj_div_sizes($page_height, $page_width, $page_width * 0.73);
    //         processData();
    //         if(switch_map == 1 || switch_map == 2){
    //             renderMap("#section_B", 0.5);
    //         }
    //         renderMap("#section_B", 0.25);
    //         renderScrollText("#section_D");
    //     }, 2000);
    // });

    $('#scroll_country_up').on('click', function(){
      scroll('country','#country_risk_cards_svg','up');
    });

    $('#scroll_country_down').on('click', function(){
      scroll('country','#country_risk_cards_svg','down');
    })

    $('#scroll_entity_up').on('click', function(){
      scroll('entity','#div_02_modal_svg','up');
    });

    $('#scroll_entity_down').on('click', function(){
      scroll('entity','#div_02_modal_svg','down');
    })
  }


  function load_dashboard(){
    //Function initiates the key components of the dashboard - sma 010617
    adj_div_sizes($(window).height(), $(window).width(), $(window).width() * 0.73);
    getRealData(dataFiles.real_data);
    getDataset_TSV(2, dataFiles.messages);
  }

  function processData() {
    onEvent_close_entity_scorecard();
    onEvent_auto_country_selection();
    onEvent_link_entity_detail();
    renderCountryTable("#country_risk_cards", datasets.country);

  }

  function adj_div_sizes(h, w, globe_size) {
    d3.select(".pos-f-t").style("width", $(window).width());
    //Function sets the size and position of key div sections along with setting some supporting variables - sma 010617
    d3.select("#section_A")
      .style("height", "100%")
      .style("width", w/4);

    // d3.select("#country_risk_cards_svg")
    //     .style("height", "90%")
    //     .style("width", w/4 * 0.9);

    var sec_A_width = $("#section_A").width() + 30;

    // set the value for country inactive path and active path
    country_inactive = "M0,1 0,"+std_rect_height+" " + sec_A_width + ","+std_rect_height+" " + sec_A_width + ","+std_rect_height/2+" " + sec_A_width + ",1 0,1";
    country_active = "M0,1 0,"+std_rect_height+" " + sec_A_width + ","+std_rect_height+" " + (sec_A_width + 15) + ","+std_rect_height/2+" " + sec_A_width + ",1 0,1";

    //set the size and position of section_B div
    d3.select("#section_B")
      .style("height", globe_size + "px")
      .style("width", globe_size + "px")
      .style("top", globe_size * -0.275 + "px")
      .style("left", globe_size * -0.265 + "px");

    sec_B_width = d3.select("#section_B")[0][0].getBoundingClientRect().width;
    sec_B_top = d3.select("#section_B")[0][0].getBoundingClientRect().top;
    sec_B_left = d3.select("#section_B")[0][0].getBoundingClientRect().left;

    //set the size and position of section_C div
    d3.select("#section_C")
      .style("height", (h * 0.75) + "px")
      .style("width", (w * 0.365) + 20 + "px")
      .style("top", globe_size * -1 + "px")
      .style("left", (w * 0.365) - 20 + "px");

    var sec_c_width = $("#section_C").width() + 30;

    entity_inactive = "M" + (sec_c_width - 0) + ",1 0,1 0,"+std_rect_height/2+" 0,"+std_rect_height+" " + (sec_c_width - 0) + ","+std_rect_height+" " + (sec_c_width - 0) + ",1";
    entity_active =   "M" + (sec_c_width - 0) + ",1 0,1 15,"+std_rect_height/2+" 0,"+std_rect_height+" " + (sec_c_width - 0) + ","+std_rect_height+" " + (sec_c_width - 0) + ",1";

    //set the size and position of section_D div
    d3.select("#section_D")
      .style("width", (globe_size + 32) + "px")
      .style("left", "-50px");

    //set the size and position of donut chart div
    d3.select("#B_donut_parent")
      .style("height", globe_size + "px")
      .style("width", globe_size + "px")
      .style("top", sec_B_top + "px")
      .style("left", sec_B_left + "px");

    d3.select("#B_donut_country")
      .style("height", globe_size + "px")
      .style("width", globe_size + "px")
      .style("top", sec_B_top + "px")
      .style("left", sec_B_left + "px");



    // remove mask before appending
    if($("#globe_mask")){
      $("#globe_mask").parent().remove();
    }
    var g = d3.select("#B_donut_country").append("g");
    //set the element for map mask
    var img = g.append("svg:image")
      .attr("id", "globe_mask")
      .attr("xlink:href", ""+"/img/globe_mask.png")
      .attr("width", globe_size)
      .attr("height", globe_size);

    $("#globe_mask").hide();
    arc_base = (sec_B_width * .5);

    title_arc = "M" + (arc_base * .75) + "," + arc_base + " A1,1 0 0,1 " + (arc_base * 1.25) + "," + arc_base;


    d3.select("#B_donut_country textPath")
      .style("top", (sec_B_top + (globe_size * 0.58))+ "px")
      .style("left", (sec_B_left + (globe_size * 0.5) - 50)+ "px");

    //set the size and position of donut chart entity label
    d3.select("#B_donut_entity")
      .style("height", "50px")
      .style("width", "100px")
      .style("top", (sec_B_top + (globe_size * 0.58))+ "px")
      .style("left", (sec_B_left + (globe_size * 0.5) - 50)+ "px");

    // $("#section_F").addClass(".removeDisplay");
    d3.select("#section_F").style("display", "none");
  }

  function getRealData(strFile){
    d3.json(strFile, function (error, data) {
      if(error){
        alert(error);
      }else{
        baseEntityData = getGroupByEntity(data);
        var num = 0;
        for (var k in data[0]) {
          if (k[0] === 'T' && k[3] === '_') {
            var txt = k.slice(4);
            ratingData.push({
              id: num++, risk: 5, txt: txt, name: k, count: d3.sum(baseEntityData, function (d) {
                return d[k]
              })
            });
          }
        }

        if(window.localStorage.ratingData){
          ratingData = JSON.parse(window.localStorage.ratingData);
        }

        for (var k = 0; k < baseEntityData.length; k++) {
          baseEntityData[k].risk = calculateScore(baseEntityData[k], ratingData);
        }
        var averageScoreTotalMax = d3.max(baseEntityData, function (d) {
          return d.risk
        });
        for (var k = 0; k < baseEntityData.length; k++) {
          if(averageScoreTotalMax){
            baseEntityData[k].risk = Math.round(baseEntityData[k].risk / averageScoreTotalMax * 10);
          }else {
            baseEntityData[k].risk = 0;
          }
        }
        getCountryData(baseEntityData);
        getDataset_TSV(2, dataFiles.messages);

        setTimeout(function () {
          onEvent_close_entity_scorecard();
          onEvent_auto_country_selection();
          onEvent_link_entity_detail();
          $('#scroll_entity_down').hide();
          $('#scroll_entity_up').hide();
          renderCountryTable("#country_risk_cards", datasets.country);
          renderMap("#section_B", 0.25);
          renderScrollText("#section_D");
        }, 100);
      }
    })

  }

  function getGroupByEntity(data){

    var groups = _.groupBy(data, function(value){
      return value.countrycleansed + '#' + value.VENDOR_NAME;
    });

    var num = 90000;
    var result_data = _.map(groups, function(group){
      return {
        country: group[0].countrycleansed,
        txt: group[0].VENDOR_NAME,
        id: num++,
        transactions: group.length,
        flagged_transactions: sum(_.map(group, function (d) {
          if (d.Flagged_Transaction > 0) {
            return parseFloat(d.Flagged_Transaction)
          } else {
            return 0
          }
        })),
        guid:group[0].VENDOR_GUID,
        country_id:group[0].country_id,
        count:group.length,
        date: maxDate(_.pluck(group, 'create_date')),
        industry:group[0].industry,
        flagged_amount: sum(_.map(group, function (d) {
          if (d.Flagged_Transaction > 0) {
            return parseFloat(d.amount)
          } else {
            return 0
          }
        })),
        amount:sum(_.map(group,function(d){
          return parseFloat(d.amount)
        })),
        T01_BANK_ACCT_MATCH: _.indexOf((_.pluck(group,'T01_BANK_ACCT_MATCH')), 1) > -1?1:0,
        T02_EMPLOYEE_ACCT_MATCH:_.indexOf((_.pluck(group,'T02_EMPLOYEE_ACCT_MATCH')), 1) > -1?1:0,
        T03_VENDOR_ADDRESS_MATCH:_.indexOf((_.pluck(group,'T03_VENDOR_ADDRESS_MATCH')), 1) > -1?1:0,
        T04_EMPLOYEE_ADDRESS_MATCH:_.indexOf((_.pluck(group,'T04_EMPLOYEE_ADDRESS_MATCH')), 1) > -1?1:0,
        T05_VENDOR_ON_WATCHLIST:_.indexOf((_.pluck(group,'T05_VENDOR_ON_WATCHLIST')), 1) > -1?1:0,
        T06_ONE_TIME_VENDOR:_.indexOf((_.pluck(group,'T06_ONE_TIME_VENDOR')), 1) > -1?1:0,
        T07_VENDOR_IN_TAX_HAVEN:_.indexOf((_.pluck(group,'T07_VENDOR_IN_TAX_HAVEN')), 1) > -1?1:0,
        T08_BANK_UNREGISTERED:_.indexOf((_.pluck(group,'T08_BANK_UNREGISTERED')), 1) > -1?1:0,
        T09_VENDOR_UNREGISTERED:_.indexOf((_.pluck(group,'T09_VENDOR_UNREGISTERED')), 1) > -1?1:0,
        T10_VENDOR_LEGAL_ISSUES:_.indexOf((_.pluck(group,'T10_VENDOR_LEGAL_ISSUES')), 1) > -1?1:0,
      }
    });
    datasets['entity']= result_data;
    console.log("result_data:", result_data);
    return result_data;
  }

  function getCountryData(data){
    var countries = crossfilter(baseEntityData).dimension(function(d){
      return d.country;
    }).group().top(Infinity);

    var country_data = [];
    var num = 900;
    for(var k=0; k < countries.length; k++){
      var item = new Object();
      var items = crossfilter(baseEntityData).dimension(function(d){
        return d.country;
      }).filter(countries[k].key).top(Infinity);
      var tempNum = num++
      item['id'] = items[0].country_id;
      item['txt'] = countries[k].key;
      item['count'] = items.length;
      item['risk'] = d3.max(items, function(d){
        return d.risk;
      })


      var riskRange = crossfilter(items).dimension(function(d){
        if (d.risk >= 8) {return "high";}
        if (d.risk >= 5) {return "med";}
        if (d.risk >= 0) {return "low";}
        else {return "review"};
      }).group().top(Infinity);

      /*var riskRange = crossfilter(items).dimension(function(d){
       return d.risk;
       }).group(function(d){
       if(d.risk<0){
       return "review";
       }else if(d.risk<5){
       return 'low';
       }else if(d.risk<8){
       return 'med';
       }else{
       return 'high';
       }
       }).top(Infinity);*/
      for(var i=0; i < riskRange.length;i++){
        item[riskRange[i].key] = riskRange[i].value;
      }
      country_data.push(item);
    }
    datasets['country'] = country_data;
    return country_data;
  }

  function sum(numbers) {
    return _.reduce(numbers, function(result, current){
      return result + parseInt(current);
    });
  }

  function maxDate(arr){
    var parseDate1 = d3.time.format("%m/%d/%y %I:%M %p").parse;
    var tempD1, tempD2, result;
    if(arr != ''){
      result = Array.prototype.reduce.call(arr, function(d1, d2){
        tempD1 = parseDate1(d1);
        tempD2 = parseDate1(d2);
        if(tempD1 < tempD2 ){
          return d2;
        }
        return d1;

      });
    }
    return result;
  }

  function  calculateScore(node, riskRating) {
    var sum = 0;
    for (var index in node) {
      for (var k =0;k < riskRating.length; k ++) {
        if (index.indexOf(riskRating[k].name) > -1) {
          sum += node[index] * riskRating[k].risk;
        }
      }
    }
    return sum;
  }

  function getDataset_TSV(iData, strFile){
    d3.tsv(strFile, function (err, data) {
      if(err){
        alert(err);
      }else {
        datasets[Object.keys(datasets)[iData]] = data;
      }
    });
  }

  function onEvent_close_entity_scorecard() {
    //Function closes the entity scorecard when user clicks on 'X' - sma 010617
    $("#close-btn").on("click", function () {
      $("#section_F").animate({
        opacity: 0,
        marginLeft: "0.6in",
        right:"-100%"
      }, std_time);

      d3.selectAll(".row_entity")
        .each(function(x) {
          d3.select("#svg_" + x.id + "_path")
            .transition()
            .duration(std_time * 0.5)
            .attr("opacity", 0.95)
            .attrTween("d", pathTween(entity_inactive, 4))
        });
    });
  }

  function onEvent_auto_country_selection() {
    //Function starts the automatic selection of countries - sma 010617
    $("#section_A.title").on("click", function () {
      $("#section_D").find("ul li").remove();
      $("#section_D").find("ul.cloned").remove();
      $active_country = undefined;
      gselected_country = "";
    });
  }

  function onEvent_link_entity_detail(){
    //Function link to entity detail
    $('#entityName').on('click', function(){
      var entity = $(this).text();
      var Guid = crossfilter(baseEntityData).dimension(function(d){
        return d.txt;
      }).filter(entity).top(Infinity)[0].guid;
      window.location = '/CERBERUS/vendor/vendor-detail/'+ Guid;
    })
  }

  function renderCountryTable(div_selector, data) {
    //Function populates Section A/Country Summary Table along with the On Click actions for the table - sma 010617
    var country_active_w = $(div_selector).width() + 20, //see [country_active] for added width
      margin = {top:5, right: 5, bottom: 5, left: 5},
      width = $(div_selector).width() - margin.left - margin.right,
      height = $(div_selector).height() - margin.top - margin.bottom,
      row_h = std_rect_height;
    country_count = data.length,
      max = d3.max(data, function(data){return +data.count;}),
      barX = $(div_selector).width()/3.5/max;

    var scroll_country_down = [ { "x": 0,   "y": std_rect_height/2},  { "x": std_rect_height/2,  "y":std_rect_height},{ "x": std_rect_height,  "y": std_rect_height/2}];
    //drawArrow(div_selector,'scroll_country_down',scroll_country_down, 'right',std_rect_height);

    data.sort(function(a, b){return d3.ascending(b.risk, a.risk) || d3.ascending(b.count, a.count);});

    console.log("data:", data);

    d3.select("#risk_country")
      .on("click", function(d) {
        switch_map = 2;// 2-> rotate globe between all countries in the dataset
        renderMap("#section_B", 0.5, true);
      });

    var svg = d3.select(div_selector + "_svg")
        .attr("width", country_active_w)
      // .attr("height", $(div_selector).height())
      ;

    var move_country_tab_up_flag=true;
    svg.selectAll("svg")
      .data(data)
      .enter().append("svg")
      .attr("id", function(d) { return "svg_" + d.id;})
      .attr("class", "row_country")
      .attr("height", row_h)
      .on("click", function(d) {
        if ($active_country === undefined) {
          $("#section_B").fadeOut(std_time * 0.1);
        }

        $("#section_F").animate({
          opacity: 0,
          marginLeft: "0.6in",
          right:"-100%"
        }, std_time);

        if ($active_country != this.id) {
          switch_map = 1;// switch globe to clicked country
          $active_country = this.id;
          d3.selectAll(".row_country")
            .each(function(x) {
              var val1 = 0.7;
              var val2 = country_inactive;
              if (d.id == x.id) {
                val1 = 0.95;
                val2 = country_active;
              }

              d3.select("#svg_" + x.id + "_path")
                .transition()
                .duration(std_time * 0.5)
                .attr("opacity", val1)
                .attrTween("d", pathTween(val2, 4))
            });

          gselected_country = crossfilter(datasets.country).dimension(function(d){
            return d.id;
          }).filter($active_country.split("_")[1]).top(Infinity)[0].txt;
          renderMap("#section_B", 0.5, true);
        }
      });

    data.forEach(function (d, i) {
      var svg = d3.select("#svg_" + d.id)
        .attr("x", function(){return -(d3.select(div_selector)[0][0].getBoundingClientRect().width * 1.05)})
        .attr("y", i * (row_h * 1.06))
        .transition()
        .duration(std_time * 0.5)
        .delay(i * std_delay_x)
        .ease(trans_ease)
        .attr("x", "0")
    });

    data.forEach(function(d, i) {
      var svg = d3.select("#svg_" + d.id);
      svg.append("path")
        .attr("id", function(d) {return "svg_" + d.id + "_path"})
        .attr("class", "row_path")
        .attr("d", country_inactive)
        .attr("opacity", "0.95")
        .attr("fill", function(d) {
          if (d.risk == -1) {return "#999999"}
          else {return country_color(d.risk);}});

      svg.append("text")
        .attr("id", function(d) {return "svg_" + d.id + "_text"})
        .attr("class", "row_text_small")
        .attr("x", "3%")
        .attr("y", "70%")
        .text(d3.format("02")((i+1)) + ".");

      svg.append("g")
        .attr("class","country_txt")
        .append("text")
        .attr("class", "row_text")
        .attr("x", "8%")
        .attr("y", "70%")
        // .text(d.txt)
        .text(function(d){
          if(d.txt.length > 16){
            return d.txt.substring(0, 16) + "...";
          } else {
            return d.txt;
          }
        })
        .on("mouseover", function(d){

          d3.select(this)
            .text(d.txt)
            .style("transform", "translateX(100%)")
            .style("animation 15s linear infinite");



          //     $("#section_F").animate({
          //     opacity: 0,
          //     marginLeft: "0.6in",
          //     right:"-100%"
          // }, std_time);
        })
        .on("mouseout", function(d){
          if(d.txt.length > 16){
            d3.select(this).text(d.txt.substring(0, 16) + "...") ;
          }
        })

      svg.append("text")
        .attr("class", "row_text")
        .attr("text-anchor", "end")
        .attr("x", "61%")
        .attr("y", "70%")
        .text(0)
        .transition()
        .delay(i * std_delay_x)
        .duration(std_time)
        .tween("text", function(d) {
          var i = d3.interpolateNumber(0, d.count);
          return function(t) {d3.select(this).text(formats.whole(i(t)));};
        });

      svg.append("rect")
        .attr("id", "svg_" + d.id + "_bar")
        .attr("class", "row_bar")
        .attr("fill", "#A32020")
        .attr("x", "63%")
        .attr("y", "16%")
        .attr("height", (row_h * 0.70))
        .attr("width", 0)
        .transition()
        .delay(i * std_delay_x)
        .duration(std_time)
        .attr("width", d.count * barX);

      svg.append("text")
        .attr("id", "val_input_" + d.id)
        .attr("class", "row_text")
        .attr("x", "45%")
        .attr("y", "70%")
        .attr("text-anchor", "middle")
        .text(0)
        .transition()
        .delay(i * std_delay_x)
        .duration(std_time)
        .tween("text", function(d) {
          var i = d3.interpolateNumber(0, d.risk);
          return function(t) {d3.select(this).text(formats.whole(i(t)));};
        });
    });

    var table_height= $(div_selector+'_svg').height();
    var country_height = data.length * std_rect_height * 1.06;
    if(country_height > table_height){
      $('#scroll_country_down').show();
      $('#scroll_country_up').show();
    }else {
      $('#scroll_country_down').hide();
      $('#scroll_country_up').hide();
    }
  }

  function renderMap(div_selector, w, clickCountry){
    // based on user inputs this function will render the globe into the page
    var margin = {top: 10, left: 10, right: 10, bottom: 10},
      width = height = d3.select("#section_B")[0][0].getBoundingClientRect().width;

    var globe_projection = d3.geo.orthographic()
      .translate([width/2, height/2])
      .scale(width * w)
      .clipAngle(90)
      .precision(0.6);

    $(div_selector).find("canvas").addClass("removeLater");
    setTimeout(function () {
      $(".removeLater").remove();
    },1);

    var canvas = d3.select(div_selector)
      .append("canvas")
      .attr("width", width)
      .attr("height", height);

    var graticule = d3.geo.graticule();

    var c = canvas.node().getContext("2d");

    var path = d3.geo.path()
      .projection(globe_projection)
      .context(c);

    canvas.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    var title = d3.select("#riskLevelShow").select("h1");

    queue()
      .defer(d3.json, dataFiles.world)
      .defer(d3.tsv, dataFiles.world_country_name)
      .await(ready);

    function ready(error, world, names) {

      if(error) throw error;
      var globe = {type: "Sphere"},
        land = topojson.feature(world, world.objects.land),
        countries = topojson.feature(world, world.objects.countries).features,
        borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b;}),
        i = -1,
        n = countries.length;

      countries = countries.filter(function(d){
        return names.some(function(n) {
          if(d.id == n.id) return d.name = n.name;
        });
      }).sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      Array.prototype.move = function (from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
        return this;
      };

      //map big object
      var map_common_obj={
        projection: globe_projection,   width: width, height: height,countries: countries, borders: borders, globe:globe, path: path,land:land
      };
      var time_prev=1;
      switch (switch_map) {
        //0-> on load rotate globe from left to right
        case 0:
          $("#B_donut_country").find("text").remove();
          $("#B_donut_country").find("path").remove();
          $("#risk_country svg").attr("x", 0);

          var velocity = 0.01, then = Date.now();
          d3.timer(function(){
            var angle = velocity * (Date.now() - then);
            globe_projection.rotate([angle, 0, 0]);
            c.clearRect(0, 0, width, height);
            c.fillStyle = "#FFE299", c.beginPath(), path(land), c.fill();
            countries.forEach(function(item){
              var selected_country = crossfilter(datasets.country).dimension(function(d){
                return d.txt;
              }).filter(item.name).top(Infinity);
              var selected_country_risk = 0;
              if(selected_country.length){
                selected_country_risk = selected_country[0].risk;
                c.fillStyle = country_color(selected_country_risk), c.beginPath(), path(item), c.fill();
              }
            });
            template_arr.push(countries[i]);
            c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#DC6900", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();
          });
          break;
        //1-> switch country to clicked country
        case 1:

          clearCountryRectangleEdges($active_country,country_active,country_inactive);

          var selected_country = crossfilter(countries).dimension(function(d){
            return d.name;
          }).filter(gselected_country).top(Infinity)[0];

          var indexSelected = countries.indexOf(selected_country);
          if(indexSelected != -1) {
            countries.move(indexSelected, 0);
          }

          // var last_node = template_arr.slice(-1).pop();
          renderPreviousCountry();
          renderCurrentCountry();
          setTimeout(function(){
            renderDonutChart("#B_donut");
            redrawDonutChart(time_prev);
          },3*std_delay_x);



          break;
        // 2-> rotate globe between all countries in the dataset
        case 2:

          clearCountryRectangleEdges($active_country,country_active,country_inactive);
          (function transition(){
            d3.transition()
              .delay(100)
              .duration(4000)
              .each("start", function(){
                $("#risk_country svg").attr("x", 0);
                if(i == 11) { i = 0;}
                var country_name = datasets.country[i = (i+1) % (datasets.country.length)].txt;
                gselected_country = country_name;

                var selected_country_id = crossfilter(datasets.country).dimension(function(d){
                  return d.txt;
                }).filter(country_name).top(Infinity)[0].id;

                // All other elements resize randomly.
                d3.selectAll(".row_country")
                  .each(function(x) {if (selected_country_id != x.id) {
                    d3.select("#svg_" + x.id + "_path")
                      .transition()
                      .duration(2000)
                      .attr("opacity", 0.7)}});

                datasets.country.forEach(function(item){
                  var p1  = d3.select("#svg_" + item.id + "_path");
                  p1.call(highlight_country, country_active, country_inactive, 0.7);
                });

                var p = d3.select("#svg_" + selected_country_id + "_path");
                p.call(highlight_country, country_inactive, country_active, 0.95);
                $("#B_donut_country").find("text").hide(500);
                $("#svg_" + selected_country_id).attr("x", 0);

                renderEntitySummary(gselected_country, datasets.entity);
                renderDonutChart("#B_donut");
                redrawDonutChart(100);
              })
              .tween("rotate", function(){
                var selected_country = crossfilter(countries).dimension(function(d){
                  return d.name;
                }).filter(gselected_country).top(Infinity)[0];

                var indexSelected = countries.indexOf(selected_country);
                if(indexSelected != -1) {
                  countries.move(indexSelected, 0);
                }

                var last_node = template_arr.slice(-1).pop();
                gprev_country = gselected_country;
                prev_country = selected_country;
                return function(t){
                  map_common_obj["t"]=t;
                  map_common_obj["country"]=selected_country;
                  map_common_obj["c"]=c;
                  rotateMap(map_common_obj);
                }})
              .transition()
              .each("end", transition);

          })();

      }

      function renderPreviousCountry(){
        // render previous country
        // if previous country is not defined then current country loads in righaway
        time_prev=1;
        if(prev_country != ""){
          d3.transition()
            .duration(1)
            .each("start", function(){
              $("#risk_country svg").attr("x", 0);
              var select_count = crossfilter(datasets.country).dimension(function(d){
                return d.txt;
              }).filter(gprev_country).top(Infinity)[0].count;
              var select_id = crossfilter(datasets.country).dimension(function(d){
                return d.txt;
              }).filter(gprev_country).top(Infinity)[0].id;
              $("#svg_" + select_id).attr("x", 0);
              renderEntitySummary(gprev_country, datasets.entity);

            }) .tween("rotate", function(){
            return function(t){

              map_common_obj["t"]=t;
              map_common_obj["country"]=prev_country;
              map_common_obj["c"]=c;
              rotateMap(map_common_obj);
            }
          });
          // if previous country is  defined then current country loads after 100 milli second than previous
          time_prev=100;
        }
        //  renderDonutChart("#B_donut");
      }
      function renderCurrentCountry(){
        //render current country
        setTimeout(function () {
          d3.transition().duration(2000)
            .each("start", function(){
              $("#risk_country svg").attr("x", 0);

              var select_count = crossfilter(datasets.country).dimension(function(d){
                return d.txt;
              }).filter(gselected_country).top(Infinity)[0].count;
              var select_id = crossfilter(datasets.country).dimension(function(d){
                return d.txt;
              }).filter(gselected_country).top(Infinity)[0].id;
              $("#B_donut_country").find("text").hide(500);
              $("#svg_" + select_id).attr("x", 0);
              renderEntitySummary(gselected_country, datasets.entity);

            })
            .tween("rotate", function(){
              gprev_country = gselected_country;
              prev_country = selected_country;
              return function(t){
                map_common_obj["t"]=t;
                map_common_obj["country"]=selected_country;
                map_common_obj["c"]=c;
                rotateMap(map_common_obj);
              }
            });
        },time_prev);
      }
      $max_evn_val=0;
      $("#section_B").fadeIn(std_time * 0.25)
      setTimeout(function () {
        $("#B_donut").fadeIn(std_time * 0.25);
      },1);
    }
  }

  function clearCountryRectangleEdges(country,active_country,inactive_country){
    //this function is to clear the edges of country rectagles
    //   var p1  = d3.select("#svg_" + country + "_path");
    var p1  = d3.select("#" + country + "_path");
    p1.call(highlight_country, active_country, inactive_country, 0.7);

    var p = d3.select("#" + country + "_path");
    p.call(highlight_country, country_inactive, country_active, 0.95);
  }

  function rotateMap(map_obj){
    //rotate map to a country according to event

    var p = d3.geo.centroid(map_obj.country),
      r = d3.interpolate(map_obj.projection.rotate(), [-p[0], -p[1]]);
    map_obj.projection.rotate(r(map_obj.t));
    map_obj.c.clearRect(0, 0, map_obj.width, map_obj.height);
    map_obj.c.fillStyle = "#FFE299", map_obj.c.beginPath(), map_obj.path(map_obj.land), map_obj.c.fill();
    map_obj.countries.forEach(function(item){
      var selected_country = crossfilter(datasets.country).dimension(function(d){
        return d.txt;
      }).filter(item.name).top(Infinity);
      var selected_country_risk = 0;
      if(selected_country.length){
        selected_country_risk = selected_country[0].risk;
        map_obj.c.fillStyle = country_color(selected_country_risk), map_obj.c.beginPath(), map_obj.path(item), map_obj.c.fill();
      }
    });
    map_obj.c.strokeStyle = "#fff", map_obj.c.lineWidth = .5, map_obj.c.beginPath(), map_obj.path(map_obj.borders), map_obj.c.stroke();
    map_obj.c.strokeStyle = "#DC6900", map_obj.c.lineWidth = 2, map_obj.c.beginPath(), map_obj.path(map_obj.globe), map_obj.c.stroke();

  }

  function redrawDonutChart(time_prev){
    //redraw donut chart when click the left country table
    setTimeout(function(){
      var svg = d3.select("#B_donut_country");

      var select_count = crossfilter(datasets.country).dimension(function(d){
        return d.txt;
      }).filter(gselected_country).top(Infinity)[0].count;
      incrementEvents(select_count);

      var entity_svg = d3.select("#div_02_modal_svg").selectAll("svg");

      entity_svg.forEach(function(d,i){
        var svg = d3.select("#svg_" + i)
          .attr("x", "700")
          .attr("y", i * (36 * 1.06))
          .transition()
          .delay(i * std_delay_x)
          .duration(2000)
          .ease(trans_ease)
          .attr("y", "663");
        svg.remove();
      });
      svg.select("#wavy").remove();
      svg.append("path")
        .attr("id", "wavy")
        .attr("d", title_arc)
        .style("fill", "none")
        .style("display", "none")
        .style("stroke", "#AAAAAA");

      svg.append("text")
        .append("textPath")
        .attr("xlink:href", "#wavy")
        .style("text-anchor", "middle")
        .style("color","white")
        .attr("font-family", "SegoeUI-Bold, Segoe UI")
        .attr("font-weight", "700")
        .attr("font-size", "36px")
        .attr("fill", "#000")
        .attr("fill-opacity", "0")
        .attr("startOffset", "50%")
        .text(gselected_country)
        .transition(250)
        .ease(trans_ease)
        .attr("fill-opacity", "1");
    }, time_prev*2);
  }

  function incrementEvents(select_count){
    //automatically increase the entity numbers
    setTimeout(function () {
      if(select_count > entity_count){
        entity_count++;
        $("#B_donut_entity h3").text(entity_count).append("<br><h6>Entities</h6>");
        incrementEvents(select_count);
      } else if(select_count < entity_count){
        entity_count--;
        $("#B_donut_entity h3").text(entity_count).append("<br><h6>Entities</h6>");
        incrementEvents(select_count);
      }
    },50);
  }

  function renderScrollText(div_selector){
    //Function creates a scrolling ticker tape of text across the top of the dashboard - sma 010617
    var listWidth = 0;
    datasets.message.forEach(function(item){
      var width = item.name.length * 9;
      listWidth += width;
      $(".textList").append("<li>" + item.name +"<font>|<font>   </li>");
    });

    $(function() { //on DOM ready
      $(".textList").simplyScroll({
        speed: 2.5,
        // startOnLoad: true,
        // auto: true,
        // pauseOnHover: true,
        // pauseOnTouch: true
      });
      $(".simply-scroll .simply-scroll-clip").css({
        "width": $(window).width()+"px"
      });
    });
  }

  function renderDonutChart(div_selector){
    // renders dount chart on globe

    // if globesize is not iniitialized below conditon satifies
    var labelRange = ["High Risk", "Medium Risk", "Low Risk", "In Review"];
    var donut_chart = d3.layout.pie()
      .sort(null)
      .value(function(d){
        return d.value;
      });
    // if(globe_size<=0){
    globe_size = d3.select("#section_B")[0][0].getBoundingClientRect().width;
    // }
    // if ($("#B_donut").find("svg").length === 0) {
    //$("#B_donut").find("svg").remove();
    drawDonutChart(div_selector, globe_size, 'svg_donut');
    // }

    //filter data by selected country
    var select_count = crossfilter(datasets.country).dimension(function(d){
      return d.txt;
    }).filter(gselected_country).top(Infinity)[0];

    function refresh_data() {
      var level_value = {
        "In Review": "review",
        "Low Risk": "low",
        "Medium Risk": "med",
        "High Risk": "high"
      };
      //var labels = ["High Risk", "Medium Risk", "Low Risk", "In Review"];
      return labelRange.map(function(label){
        return { label: label, value: select_count[level_value[label]]==undefined?0:select_count[level_value[label]]}
      });
    }

    update_donut_slices(refresh_data());
    /* ------- DONUT SLICES -------*/
    function update_donut_slices(data) {
      var colorRange = ["#E0301E", "#DC6900", "#FFB600", "#999999"];
      var radius = globe_size / 3;

      var data = donut_chart(data);
      var data_result = data;

      drawSliceWithLabel(data_result, radius,"#svg_donut",'slice',.65, .5,labelRange, colorRange,donut_chart);

      /* ------- TEXT LABELS -------*/
      $("#svg_donut").find("text").hide(250)
      setTimeout(function () {
        var key = function(d){ return d.data.label; };
        d3.select("#svg_donut").select(".labels").selectAll("text").remove();
        var text = d3.select("#svg_donut").select(".labels").selectAll("text")
          .data(data_result, key);

        text.enter()
          .append("text")
          .attr("x", 0)
          .attr("dy", 30)
          //.attr("dy", function(d,i) { return (d.endAngle > 90 * Math.PI/180 ? 18 : 50); })
          .append("textPath")
          .attr("xlink:href", function(d,i){ return "#slice_" + i;})
          .attr("startOffset","20px")
          //.attr("startOffset","2.5%")
          .attr("font-family", "SegoeUI-Bold, Segoe UI")
          .attr("font-weight", "500")
          .attr("font-size", std_font_size)
          .attr("fill", "#fff")
          .text(function(d, i) {
            if (d.value == 0) {
              return "";
            } else {
              return d.data.label + " " + d.data.value;
            }

          });

        var num = 0;
        data_result.forEach(function(item){
          if(item.data.value !== 0){
            num ++;
          }
        })

        if(num === 1) {
          d3.select("#svg_donut").select(".labels").selectAll("text").attr("x", "690");
        }

        text.exit()
          .remove();
      },500);

    };

  }

  //pre_per-> previous transaction value
  function renderEntityDetailDonutChart(data, div_selector, pre_per, colorRange){
    //reder entity detail donut chart
    $(div_selector).find("svg").hide();
    //default width/height for entity detail chart
    var size = 150;



    var svg = drawDonutChart(div_selector, size, div_selector + "_donut");

    var donut_chart = d3.layout.pie()
      .sort(null)
      .value(function(d){
        return d.value;
      });

    drawSlice(svg,data, size/2,'arc',.9,.5, colorRange,donut_chart);

    // draw number in circle and animate
    var i = d3.interpolateNumber(pre_per, Math.round((data[0].value / (data[1].value + data[0].value)) *100));

    svg.append("text")
      .attr("class", "entity_donut_text")
      .attr("x", 0)
      .attr("y", 0)
      .transition()
      .duration(std_time * 0.5)
      .tween("text", function () {
        var that = d3.select(this);
        return function (t) {
          that.text(formats.whole(i(t)) + "%");
        };
      });

    svg.append("text")
      .attr('class', 'entity_donut_flagged')
      .attr("x", 0)
      .attr("y", 20)
      .text("Flagged");
  }

  //size-> donut chart height / width
  function drawDonutChart(div_selector, size,svg_name){
    //Creates initial svg for all the donuts charts in the page
    var svg = d3.select(div_selector)
      .append("svg")
      .attr("id", svg_name)
      .attr("width", size)
      .attr("height", size)


      .append("g")
      .attr("transform", "translate(" + (size * 0.5) + "," + (size * 0.5) + ")");

    svg.append("g")
      .attr("class", "slices");

    svg.append("g")
      .attr("class", "labels");

    return svg;
  }

  function drawSlice(svg,data, radius, className,out_size, in_size,colorRange,donut_chart){
    // in donunchart, it will draw the slices based on the inputed data
    var  slice_arc_entity = d3.svg.arc()
      .outerRadius(radius * out_size)
      .innerRadius(radius * in_size);

    var g = svg.selectAll("."+className)
      .data(donut_chart(data))
      .enter().append("g")
      .attr("class", className);

    g.append("path")
      .attr("id", function(d, i) { return className+"_" + i;})
      .attr("d", slice_arc_entity)
      .attr("stroke", "#fff")
      .style("fill-opacity", "0.9")
      .attr("stroke-width", "2px")
      .attr("fill", function(d ,i){return colorRange[i];});
  }

  function drawSliceWithLabel(data_result, radius,svg_id,className,out_size, in_size,labelRange, colorRange, donut_chart){
    // in donunchart, it will draw the slices by label
    var slice_arc = d3.svg.arc()
      .outerRadius(radius * out_size)
      .innerRadius(radius * in_size);

    var key = function(d){ return d.data.label; }; //get the label name

    donut_color = d3.scale.ordinal()
      .domain(labelRange)
      .range(colorRange);



    var slice = d3.select(svg_id).select(".slices").selectAll("path.slice")
      .data(data_result, key);

    slice.enter()
      .insert("path")
      .style("fill", function(d) { return donut_color(d.data.label); })
      .style("fill-opacity", "0.9")
      .style("stroke", "#fff")
      .attr("id", function(d, i) { return className+"_" + i; })
      .attr("class", "slice")

    slice
      .transition().duration(1000)
      .attrTween("d", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          return slice_arc(interpolate(t));
        };
      })

    slice.exit()
      .remove();
  }

  function highlight_country(path, country_inactive, country_active, opacity) {
    //this function is used to enable the sharp edges in country table
    path.transition()
      .duration(2000)
      .attr("opacity", opacity)
      .attrTween("d", pathTween(country_active, 4))
  }

  function pathTween(country_active, precision) {
    //Sub function for enabling the sharp edges in country table
    return function() {
      var path0 = this,
        path1 = path0.cloneNode(),
        n0 = path0.getTotalLength(),
        n1 = (path1.setAttribute("d", country_active), path1).getTotalLength();
      // Uniform sampling of distance based on specified precision.
      var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
      while ((i += dt) < 1) distances.push(i);
      distances.push(1);
      // Compute point-interpolators at each distance.
      var points = distances.map(function(t) {
        var p0 = path0.getPointAtLength(t * n0),
          p1 = path1.getPointAtLength(t * n1);
        return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
      });
      return function(t) {
        return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : country_active;
      };
    };
  }

  function renderEntitySummary(countryName, entity_data) {
    // renders entity summary table
    $("#div_02_modal").fadeIn(std_time * 0.25);
    $("#globe_mask").fadeIn(std_time * 0.25);


    d3.selectAll('.row_entity').remove();
    d3.selectAll(".row_entity")
      .each(function(d, i) {
        var svg = d3.select("#svg_" + d.id)
            .transition()
            .duration(std_time * 0.5)
            .ease(trans_ease)
            .attr("y", "800")
          ;
      });
    clearTimeout(entity_clear_time);
    entity_clear_time=setTimeout(function () {
      var openRiskData = [];
      var activeTab = 0;

      var risk_count = 0;
      var risk_open = false;
      var all_entity_data = [];

      var row_h = std_rect_height;
      //d3 default function to get linear color from given color array
      var color = d3.scale.linear()
        .domain([-1, 0, 1, 5, 10])
        .range(["#999999", "#B27F00", "#FFB600", "#DC6900", "#E0301E"]);
      //Number format
      var format = d3.format(",d");
      var ease = d3.easeCubicOut;
      open_risk_registration();

      // load data will be called when we click on 4 tabs. Respetive Data is passed as input. This will refresh the data every time we click on the tab
      function loadData(data, max, barTrans, barAmount) {
        data.forEach(function (d, i) {
          var svg = d3.select("#svg_" + d.id);

          svg.append("path")
            .attr("id", function(d) {return "svg_" + d.id + "_path"})
            .attr("class", "row_path")
            .attr("d", entity_inactive)
            .attr("opacity", "0.95")
            .attr("fill", function(d) {
              if (d.risk == -1) {return "#999999"}
              else {return color(d.risk);}});

          var entity_risk = svg.append("text")
            .attr("class", "row_text")
            .attr("x", "27%")
            .attr("y", "70%")
            .style("text-anchor", "middle")
            .text(function(d, i) {
              if (d.risk == -1) {
                return "In Review";
              } else {
                return d.risk;
              }})

          svg.append("text")
            .attr("class", "row_text_small")
            .attr("x", "4%")
            .attr("y", "70%")
            .text(d3.format("02")(i+1) + ".")

          svg.append("text")
            .attr("class", "row_text")
            .attr("x", "7%")
            .attr("y", "70%")
            .text(d.txt)

          var format = d3.format(".3s");

          svg.append("text")
            .text(0)//format(d.count))
            .attr("class", "row_text")
            .attr("x", "43%")
            .attr("y", "70%")
            .attr("text-anchor", "end")
            .transition()
            .delay(((i) * std_delay_x))
            .duration(std_time)
            .tween("text", function (d) {
              var that = d3.select(this);
              var i = d3.interpolateNumber(0, d.count);
              return function(t) {d3.select(this).text(formats.trunc(i(t)));};
            })

          svg.append("rect")
            .attr("id", "row_" + d.id + "_bar_1")
            .attr("class", "row_bar")
            .attr("x", "45%")
            .attr("y", "16%")
            .attr("height", row_h * 2/3)
            .attr("width", 0)//d.count * barX)
            .attr("fill", function (d) {
              if (d.risk < 0) {
                return "white"
              }
              else {
                return "#A32020";
              }
            })
            .attr("fill-opacity", function (d) {
              if (d.risk <= 0) {
                return .5
              }
              else {
                return d.risk / 5;
              }
            })
            .transition()
            .delay(((i) * std_delay_x))
            .duration(std_time)
            .attr("width", d.count * barTrans);

          svg.append("text")
            .attr("class", "row_text")
            .attr("x", "76%")
            .attr("y", "70%")
            .style("text-anchor", "end")
            .text(0)
            .transition()
            .delay((( i) * std_delay_x))
            .duration(std_time)
            .tween("text", function (d) {
              var that = d3.select(this);
              var i = d3.interpolateNumber(0, d.amount);
              return function (t) {
                that.text("$" + formatAbbreviation(i(t)));
              };
            })

          svg.append("rect")
            .attr("id", "row_" + d.id + "_bar_2")
            .attr("class", "row_bar")
            .attr("x", "78%")
            .attr("y", "16%")
            .attr("height", row_h * 2/3)
            .attr("width", 0)
            .attr("fill", function (d) {
              if (d.risk < 0) {
                return "white"
              }
              else {
                return "#A32020";
              }
            })
            .attr("fill-opacity", function (d) {
              if (d.risk <= 0) {
                return .5
              }
              else {
                return d.risk / 5;
              }
            })
            .transition()
            .delay((( i) * std_delay_x))
            .duration(std_time * 0.5)
            .attr("width", d.amount * barAmount);
        });
      }

      function showRisk(data) {
        // show entity table
        d3.selectAll("#img_card").transition().duration(1000).style("opacity", 0)
        d3.selectAll("#txt_card").transition().duration(1000).style("fill-opacity", 0);
        d3.selectAll("#txt_card_vendor").transition().duration(1000).style("fill-opacity", 0);
        d3.selectAll("#txt_card_risk").transition().duration(1000).style("fill-opacity", 0);
        d3.selectAll("#txt_card_total").transition().duration(1000).style("fill-opacity", 0);

        d3.selectAll("#button").transition().duration(1000).attr("y", "-16");
        d3.select("#risk_header").transition().duration(300).attr("y", "0");
        d3.selectAll("#risk_header_text").transition().duration(300).attr("y", "19");
        var item_height = risk_count* std_rect_height;
        var country_height=$('#country_risk_cards_svg').height()
        if (item_height > country_height) {
          //d3.select("#div_02_modal").transition().duration(1000).style("height", ((risk_count + 1) * 40 + "px"));
          d3.select("#div_02_modal").transition().duration(1000).style("height", country_height+'px');
          $('#scroll_entity_up').show();
          $('#scroll_entity_down').css('top',item_height).show();
        }else {
          $('#scroll_entity_down').hide();
          $('#scroll_entity_up').hide();
        };
        data.forEach(function (d, i) {
          var svg = d3.select("#svg_" + d.id)
            .attr("x", function(){return d3.select("#section_C")[0][0].getBoundingClientRect().width})
            .attr("y", ((i) * (std_rect_height * 1.06)))

            .transition()
            .duration(1000)
            .delay((i) * std_delay_x)
            .ease(trans_ease)
            .attr("x", "0")
        })
      }

      function hideRisk(data) {
        //hide entity table
        d3.selectAll("#img_card").transition().duration(3000).style("opacity", 1)
        d3.selectAll("#txt_card").transition().duration(3000).style("fill-opacity", 1);
        d3.selectAll("#txt_card_vendor").transition().duration(3000).style("fill-opacity", 1);
        d3.selectAll("#txt_card_risk").transition().duration(3000).style("fill-opacity", 1);
        d3.selectAll("#txt_card_total").transition().duration(3000).style("fill-opacity", 1);
        d3.selectAll("#button").transition().duration(2000).attr("y", "0");
        var item_height = risk_count* std_rect_height * 1.06;
        var country_height=$('#country_risk_cards_svg').height()
        if (item_height > country_height) {
          //d3.select("#div_02_modal").transition().duration(1000).style("height", ((risk_count + 1) * 40 + "px"));
          d3.select("#div_02_modal").transition().duration(1000).style("height", country_height+'px');
          $('#scroll_entity_up').show();
          $('#scroll_entity_down').css('top',item_height).show();
        }else {
          $('#scroll_entity_down').hide();
          $('#scroll_entity_up').hide();
        };
        data.forEach(function (d, i) {
          var svg = d3.select("#svg_" + d.id)
            .transition()
            .duration(1000)
            .delay(i * 200)
            .ease(trans_ease)
            .attr("y", "-60")
        })
        d3.select("#risk_header").transition().duration(600).delay((risk_count + 1) * 200).attr("y", "-60");
        d3.selectAll("#risk_header_text").transition().duration(600).delay((risk_count + 1) * 200).attr("y", "-36");

      }
      function hideOtherRisk(data) {
        // This method will close already open tab when we cliked on new tab
        d3.selectAll("#button").transition().duration(1000).attr("y", "0");
        var item_height = risk_count* std_rect_height* 1.06;
        var country_height=$('#country_risk_cards_svg').height()
        if (item_height > country_height) {
          //d3.select("#div_02_modal").transition().duration(1000).style("height", ((risk_count + 1) * 40 + "px"));
          d3.select("#div_02_modal").transition().duration(1000).style("height", country_height+'px');
          $('#scroll_entity_up').show();
          $('#scroll_entity_down').css('top',item_height).show();
        }else {
          $('#scroll_entity_down').hide();
          $('#scroll_entity_up').hide();
        };
        openRiskData.forEach(function (d, i) {
          var svg = d3.select("#svg_" + d.id)
            .transition()
            .duration(1000)
            .delay(i * 200)
            .ease(trans_ease)
            .attr("y", "-60")
        })
        d3.select("#risk_header").transition().duration(600).delay((risk_count + 1) * 200).attr("y", "-60");
        d3.selectAll("#risk_header_text").transition().duration(600).delay((risk_count + 1) * 200).attr("y", "-36");
      }

      function open_risk_registration() {
        //Renders entity table based on country selected
        if (activeTab !== 1 || all_entity_data.length === 0) {
          all_entity_data = entity_data;
        }

        var selected_country_id = crossfilter(datasets.country).dimension(function(d){
          return d.txt;
        }).filter(countryName).top(Infinity)[0].id;

        var data = crossfilter(all_entity_data).dimension(function(d){
          return d.country_id;
        }).filter(selected_country_id).top(Infinity);

        risk_count = data.length;


        data.sort(function (a, b) {
          return d3.ascending(b.risk, a.risk) || d3.ascending(b.transactions, a.transactions);
          //return d3.descending(b.risk, a.risk) || d3.descending(b.transactions, a.transactions);
        });

        var transMax = d3.max(data, function (data) {
          return +data.count;
        });

        var amountMax = d3.max(data, function (data) {
          return data.amount;
        })

        var barTrans = $("#div_02_modal_svg").width() * 0.2 / transMax;
        var barAmount = $("#div_02_modal_svg").width() * 0.2 / amountMax;
        var timeout = 0;
        if (openRiskData && openRiskData.length > 0 && activeTab != 1) { // If there is an already open tab
          risk_open = false;
          timeout = 3000; // time out of 3 sec is given before opening the new tab
          hideOtherRisk();
        }

        if (risk_open === false) {  // If there is an already open tab
          setTimeout(function () {
            openRiskData = data;
            activeTab = 1;
            var svg = d3.select("#div_02_modal_svg");
            d3.selectAll(".row_entity").remove();
            var svg = d3.select("#div_02_modal").select("#div_02_modal_svg").selectAll("svg")
              .data(data)
              .enter()
              .append("svg")
              .attr("id", function (d) {return "svg_" + d.id})
              .attr("class", "row_entity")
              .attr("height", std_rect_height* 1.06)
              .attr("font-size", std_font_size)
              .attr("width", "100%")
              .on("click", function (d) {
                // $(".removeDisplay").remove();
                $("#section_F").css("display", "inline");
                if (prev_entity != d.id) {
                  prev_entity = d.id;
                  d3.selectAll(".row_entity")
                    .each(function(x) {
                      var val1 = 0.7;
                      var val2 = entity_inactive;
                      if (d.id == x.id) {
                        val1 = 0.95;
                        val2 = entity_active;
                      }

                      d3.select("#svg_" + x.id + "_path")
                        .transition()
                        .duration(std_time * 0.5)
                        .attr("opacity", val1)
                        .attrTween("d", pathTween(val2, 4))
                    });

                  showEntityDetail(d,color(d.risk));
                }
              }).on('mouseover',function(d,i){
                //scroll('.row_entity','#div_02_modal_svg',this);
              });

            loadData(data, transMax, barTrans, barAmount);
            risk_open = true;
            showRisk(data);
          }, timeout);
        }
        else {
          risk_open = false;
          activeTab = 0;
          openRiskData = [];
          hideRisk(data);
        }
      }
    }, std_time);
  }

  function showEntityDetail(d, color) {
    // show the entity popup when click on entity box
    d3.select("#section_F")
      .style("opacity", 0.95)
      .transition()
      .duration(std_time * 0.5)
      .ease(trans_ease)
      .style("border-color", color)
      .style("background-color", color);

    $("#entityName").text(d.txt);
    $("#initiated-date").text(d.date);
    $("#industry").text(d.industry);
    var colorRange = ["#E0301E","#FFB600"]
    var value = parseInt(Math.random() * 60) + 20;
    var iT = d3.interpolateNumber(prev_transaction, d.transactions);
    d3.select("#totalTransactions")
      .text(0)
      .transition()
      .duration(std_time * 0.5)
      .ease(trans_ease)
      .tween("text", function () {
        var that = d3.select(this);
        return function (t) {
          that.text(formats.trunc(iT(t)));
        };
      });

    var rdm = ((Math.random() * 40) + 10) + "%"; // get random value
    d3.select("#risk_v_value_r")
      .transition()
      .duration(std_time * 0.5)
      .ease(trans_ease)
      .attr("width", rdm)

    var iA = d3.interpolateNumber(prev_amount, d["amount"]);  //get animation
    d3.select("#totalAmount")
      .text(0)
      .transition()
      .duration(std_time * 0.5)
      .ease(trans_ease)
      .tween("text", function () {
        var that = d3.select(this);
        return function (t) {
          that.text("$" + formatAbbreviation(iA(t)));
        };
      });
    prev_transaction = d.transactions;
    prev_amount = d["amount"];
    var transData = [
      {label: "Flagged", value:d.flagged_transactions},
      {label: "sum", value:d.transactions - d.flagged_transactions}];
    var amountData = [
      {label: "Flagged", value:d.flagged_amount},
      {label: "sum", value:d.amount - d.flagged_amount}];
    renderEntityDetailDonutChart(transData, ".bar-chart.transactions", prev_transaction_per, colorRange);
    renderEntityDetailDonutChart(amountData, ".bar-chart.total-amount", prev_amount_per, colorRange);
    prev_transaction_per = Math.round((d.flagged_transactions / d.transactions) * 100);
    prev_amount_per = Math.round((d.flagged_amount / d.amount) * 100);

    $( "#section_F" ).animate({
      marginLeft: "0.6in",
      right:"0.2%"
    }, 1500 );
  }

  function scroll(columnName, div_selector,direction){
    var columnClass = '.row_'+ columnName;
    if(direction=='up'){
      $add_value=Number(d3.select(columnClass).attr("height"));
      $first_element=Number(d3.select(columnClass).attr("y"));
      if(  $first_element>=0){
        return false;
      }
    }else{
      $add_value=-Number(d3.select(columnClass).attr("height"));
      $last_element = Number(d3.select(d3.selectAll(columnClass)[0][$(columnClass).length-2]).attr('y'));
      if($last_element<=0){
        return false;
      }
    }

    d3.selectAll(columnClass).each(function(d, i) {
      //console.log($rect_y_pos+"---"+$country_tbl_height);
      d3.select("#"+this.id).attr("y",
        Number(d3.select("#"+this.id).attr("y"))+$add_value ) ;
    });

  }

  function drawArrow(div_selector,svg_name, path,direction,size){

    //The data for our line
    var lineData = path;

    //This is the accessor function we talked about above
    var lineFunction = d3.svg.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .interpolate("linear");

    //The SVG Container
    var svgContainer = d3.select(div_selector).append("svg")
      .attr('id', svg_name)
      .style('position','absolute')
      .style('top',3)
      .style(direction, -size)
      .style('z-index',999)
      .attr("width", size)
      .attr("height", size/2);

    //The line SVG Path we draw
    var lineGraph = svgContainer.append("path")
      .attr("d", lineFunction(lineData))
      .attr("stroke", "blue")
      .attr("stroke-width", 2)
      .attr("fill", "none");

  }
})
