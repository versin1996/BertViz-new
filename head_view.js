/**
 * @fileoverview Transformer Visualization D3 javascript code.
 *
 *

 *  Based on: https://github.com/tensorflow/tensor2tensor/blob/master/tensor2tensor/visualization/attention.js
 *
 * Change log:
 *
 * 12/19/18  Jesse Vig   Assorted cleanup. Changed orientation of attention matrices.
 */

requirejs(['jquery', 'd3'], function($, d3) {

    const TEXT_SIZE = 5;
    const BOXWIDTH = TEXT_SIZE * 8;
    const BOXHEIGHT = TEXT_SIZE * 1.5;
    const HEIGHT_PADDING = 20;
    const WIDTH = 1200;
    const HEIGHT = 800 * BOXHEIGHT * 2 + HEIGHT_PADDING;
    const MATRIX_WIDTH = 150;
    const CHECKBOX_SIZE = 20;
    const HEAD_COLORS = d3.scale.category10();
    const TOKEN_COLORS = d3.scale.category10();
    var HEAD_COLORS_ARR = [];
    var TOKEN_COLORS_ARR = [];
    
    var nHeads;
    var headVis = null;
    var tokenVis = new Array(4).fill(true);

    var text;
    var attn;
    var layer = 0;
    var browseMode = 0;
    var token_type_display_flag = false;
    var dir = "http://127.0.0.1:8080/Desktop/BertViz/data/"

    function loadJson(layer, type) {
        var request = new XMLHttpRequest();
        if(type == "text")
        {
            request.open("get", dir + "text.json");
        }    
        else if(type == "attn")
        {
            request.open("get", dir + "layer_" + layer + ".json");
        }
        request.send(null);
        request.onload = function() {
            if (request.status == 200) {
                if(type == "text")
                {
                    text = JSON.parse(request.responseText)["text"];
                }    
                else if(type == "attn")
                {
                    attn = JSON.parse(request.responseText);
                    nHeads = attn.index.length;
                    if(!headVis)
                    {
                        headVis = new Array(nHeads).fill(true);
                    }
                    drawCheckboxes(0, d3.select("#vis").select("svg"), nHeads);
                    render()
                    if(browseMode == 1)
                    {
                        var svg = d3.select("#vis").select("svg");
                        for(var i=0; i<text.length; i++)
                        {
                            drawLine(svg, i, true);
                        }
                    }
                }                   
            }
        }
    }

    function drawLineCore(svg, x1, y1, x2, y2, head, color, degree) {
        svg.append("line")
        .attr("id", "line" + head)
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("opacity", degree > 0 ? (degree > 0.08 ? degree : 0.08) : 0);
    }

    function drawLine(svg, index, isLeft) {
        for(var j in attn.index)
        {
            if(headVis[Number(j)])
            {
                if(isLeft)
                {
                    for(var i in attn.index[j][index])
                    {
                        var x1 = isLeft ? BOXWIDTH : BOXWIDTH + MATRIX_WIDTH;
                        var y1 = BOXHEIGHT * (index + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                        var x2 = isLeft ? BOXWIDTH + MATRIX_WIDTH : BOXWIDTH;
                        var y2 = BOXHEIGHT * (attn.index[j][index][i] + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                        var color = HEAD_COLORS(j);
                        if(token_type_display_flag){
                            var color_index = matrix['matrix'][index][attn.index[j][index][i]][0];
                            if(tokenVis[color_index])
                            {
                            	var color = TOKEN_COLORS_ARR[color_index];
                            }
                            else
                            {
                            	continue;
                            }       
                        } 
                        drawLineCore(svg, x1, y1, x2, y2, j, color, attn.data[j][index][i]);
                    }
                }
                else
                {
                    for(var i in attn.right_index[j][index])
                    {
                        var x1 = isLeft ? BOXWIDTH : BOXWIDTH + MATRIX_WIDTH;
                        var y1 = BOXHEIGHT * (index + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                        var x2 = isLeft ? BOXWIDTH + MATRIX_WIDTH : BOXWIDTH;
                        var y2 = BOXHEIGHT * (attn.right_index[j][index][i] + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                        drawLineCore(svg, x1, y1, x2, y2, j, HEAD_COLORS(j), attn.right_data[j][index][i]);
                    }
                }
            }    
        }
    }

    function drawLineSingleHead(svg, head) {
        for(var index=0; index<text.length; index++)
        {
            for(var i in attn.index[head][index])
            {
                var x1 = BOXWIDTH;
                var y1 = BOXHEIGHT * (index + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                var x2 = BOXWIDTH + MATRIX_WIDTH;
                var y2 = BOXHEIGHT * (attn.index[head][index][i] + 1) + BOXHEIGHT / 2 + HEIGHT_PADDING;
                var color = HEAD_COLORS(head);
                if(token_type_display_flag){
                    var color_index = matrix['matrix'][index][attn.index[head][index][i]][0];
                 	if(tokenVis[color_index])
                    {
                    	var color = TOKEN_COLORS_ARR[color_index];
                    }
                    else
                    {
                    	continue;
                    }  
                }
                drawLineCore(svg, x1, y1, x2, y2, head, color, attn.data[head][index][i]);
            }
        }      
    }

    function removeLine(...head) {
        if(head.length)
        {
            d3.select("#vis").select("svg").selectAll("#line" + head).remove();
        }
        else
        {
            for(var i=0; i<nHeads; i++)
            {
                d3.select("#vis").select("svg").selectAll("#line" + i).remove();
            }  
        }      
    }

    function lighten(color) {
        var c = d3.hsl(color);
        var increment = (1 - c.l) * 0.6;
        c.l += increment;
        c.s -= increment;
        return c;
    }

    function toGrey() {
        return "#DDDDDD";
    }
    
    function render() {
        $("#vis svg").empty();
        $("#vis").empty();
        console.log(attn);

        var svg = d3.select("#vis")
            .append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .style("position", "absolute")
            .style("margin-top", "60px")
            
        renderText(svg, text, attn, true, 0);
        renderText(svg, text, attn, false, MATRIX_WIDTH + BOXWIDTH);

        d3.select("#vis")
            .append('div')
            .attr('id', '5201314')
            .style("float", "left")
            .style("position", "absolute")
            .style("left", "400px")
            .style("top", "50px")
            .style("position", "fixed");
    }

    function renderText(svg, text, attn, isLeft, leftPos) {
        var id = isLeft ? "left" : "right";
        var textContainer = svg.append("svg:g")
            .attr("id", id);

        var tokenContainer = textContainer.append("g") //容纳单词列
            .attr("id", "textContainer")
            .selectAll("g")
            .data(text)
            .enter()
            .append("g");

        var textEl = tokenContainer.append("text") //单词文本
            .text(function(d) {  
                if(d.length < 15)
                {
                    for(var i=0; i<15-d.length; i++)
                        d += ' ';
                }
                return d;
            })
            .attr("font-size", TEXT_SIZE + "px")
            .style("cursor", "default")
            .style("-webkit-user-select", "none")
            .attr("x", leftPos)
            .attr("y", function(d, i) {
                return HEIGHT_PADDING + (i + 1) * BOXHEIGHT;
            })
            .attr("width", BOXWIDTH)
            .attr("height", BOXHEIGHT);

        textEl.style("text-anchor", isLeft ? "end" : "start") //设置文本对齐方式
            .attr("dx", isLeft ? (BOXWIDTH - 0.5 * TEXT_SIZE) : (0.5 * TEXT_SIZE))
            .attr("dy", TEXT_SIZE);

        var amplification;
        tokenContainer.on("mouseover", function(d, index) { //onmouseover
            //console.log(index)
            amplification = document.getElementById('amplification');
            if(!amplification)
            {
                var oVis = document.getElementById('vis');
                amplification = document.createElement("ul");
                amplification.setAttribute('id', 'amplification');
                amplification.innerHTML = this.innerHTML;
                amplification.style.position='absolute';
                amplification.style.width='200px';
                amplification.style.height='80px';
                amplification.style.fontSize = '30px';
                amplification.style.left = event.offsetX+'px';
                amplification.style.top = (event.offsetY - 20)+'px';
                oVis.appendChild(amplification);
            }
            else
            {
                amplification.innerHTML = this.innerHTML;
                amplification.style.left = event.offsetX+'px';
                amplification.style.top = (event.offsetY - 20)+'px';
            }
            if(browseMode == 0)
            {
                drawLine(svg, index, isLeft);
                var attention = getAttention(index, isLeft);

                $("#5201314").empty();
                var oContext = document.getElementById('5201314');
                for(var i=0; i<attention.length; i++)
                {
                    var word = document.createElement("div");
                    if(attention[i][1] == "fillDot")
                    {
                        word.innerHTML = '<h2>' + text[attention[i][0]] + ' ......&nbsp</h2>';
                    }
                    else
                    {
                        word.innerHTML = '<h2>' + text[attention[i][0]] + '&nbsp</h2>';
                    }
                    word.setAttribute('id', 'word' + i);              
                    word.style.display = "inline-block";
                    word.style.opacity = attention[i][2] > 0.08 ? attention[i][2] : 0.08;//; //degree
                    if(index == attention[i][0])
                    {
                        word.style.fontSize = "25px";
                    }
                    if(attention[i][1] != "fill" && attention[i][1] != "fillDot")
                    {
                        word.style.color = HEAD_COLORS_ARR[attention[i][1]];
                    }
                    oContext.appendChild(word); 
                }
            } //局部模式   
        });

        textContainer.on("mouseout", function() {
            amplification = document.getElementById('amplification');
            if(amplification)
            {
                amplification.parentNode.removeChild(amplification);
            }
            if(browseMode == 0)
            {    
                removeLine();
            } //局部模式 
        });
    }

    function getAttention(index, isLeft) {
        var result = [];
        for(var head=0; head<nHeads; head++)
        {
            var j, d;
            if(headVis[head])
            {   
                if(isLeft)
                {
                    for(var i in attn.index[head][index])
                    {
                        j = attn.index[head][index][i];
                        d = attn.data[head][index][i]; 
                        result.push([j, head, d]);
                    }
                }
                else
                {
                    for(var i in attn.right_index[head][index])
                    {
                        j = attn.right_index[head][index][i];
                        d = attn.right_data[head][index][i];
                        result.push([j, head, d]);
                    }
                }
            }
        }
        result.push([index, nHeads+1, 1.0]);
        result = fill(result);
        return result;
    }

    function fill(arr) {
        var result = sortAndSet(arr);
        var temp = [];
        for(var i=0, j=1; j<result.length; i++, j++)
        {
            if(result[i][0] < result[j][0] - 10)
            {
                for(var k=1; k<=5; k++)
                {
                    temp.push([result[i][0]+k, "fill", 1.0]);
                    temp.push([result[j][0]-k, "fill", 1.0]);
                }
            }
            else
            {
                for(var k=result[i][0]+1; k<result[j][0]; k++)
                {
                    temp.push([k, "fill", 1.0]);
                }
            }
        }
        for(var i=result[0][0]-1, step = 5; i>0 && step>0; i--, step--)
        {
            temp.push([i, "fill", 1.0]);
        }
        for(var i=result[result.length-1][0]+1, step = 5; i<text.length && step>0; i++, step--)
        {
            temp.push([i, "fill", 1.0]);
        }
        for(var i=0; i<temp.length; i++)
        {
            result.push(temp[i]);
        }
        result = sortAndSet(result);
        for(var i=0, j=1; j<result.length; i++, j++)
        {
            if(result[i][0] < result[j][0] - 1)
            {
                result[i][1] = "fillDot";
            }
        }
        return result;
    }

    function sortAndSet(arr) {
        var temp, result = [];
        for(var loc=arr.length-1; loc>=1; loc--)
        {
            for(var i=0; i<loc; i++)
            {
                if(arr[i][0] > arr[i+1][0])
                {
                    temp = arr[i];
                    arr[i] = arr[i+1];
                    arr[i+1] = temp;
                }
                if(arr[i][0] == arr[i+1][0])
                {
                    arr[i][1] = null;
                }
            }
        }
        for(var i=0; i<arr.length; i++)
        {
            if(arr[i][1] != null)
            {
                result.push(arr[i]);
            }  
        }
        return result;
    }

    function updateCheckboxes() {
        var checkboxContainer = d3.select("#checkboxContainer")
        var tokenCheckboxContainer = d3.select("#tokenCheckboxContainer")
        checkboxContainer.selectAll("rect")
            .data(headVis)
            .attr("fill", function(d, i) {
                var headColor = HEAD_COLORS(i);
                var color = d ? headColor : lighten(headColor);
                return color;
            });

        if(token_type_display_flag)
        {
            tokenCheckboxContainer.selectAll("rect")
                .data(tokenVis)
                .attr("fill", function(d, i) {
                    var tokenColor = TOKEN_COLORS(i);
                    var color = d ? tokenColor : lighten(tokenColor);
                    return color;
                });
        }
        else
        {
            tokenCheckboxContainer.selectAll("rect")
                .data(tokenVis)
                .attr("fill", function(d, i) {
                    return toGrey();
                });
        }
    }

    function drawCheckboxes(top, svg, nHeads) {
        $("#console g").empty();
        $("#console g").remove();
        HEAD_COLORS_ARR = [];
        TOKEN_COLORS_ARR = [];
        var checkboxContainer = d3.select("#console")
            .append("g")
            .append("g")
            .append("svg")
            .style("top", "0px")
            .style("width", "500px")
            .style("height", "25px")
            .append("g")
            .attr("id", "checkboxContainer");
        var checkbox = checkboxContainer
            .selectAll("rect")
            .data(headVis)
            .enter()
            .append("rect")
            .attr("id", "checkbox")
            .attr("fill", function(d, i) {
                HEAD_COLORS_ARR.push(HEAD_COLORS(i));
                return HEAD_COLORS(i);
            })
            .attr("x", function(d, i) {
                return (i + 1) * CHECKBOX_SIZE;
            })
            .attr("y", top)
            .attr("width", CHECKBOX_SIZE)
            .attr("height", CHECKBOX_SIZE);

        var tokenCheckboxContainer = d3.select("#console")
            .select("g")
            .append("g")
            .append("svg")
            .style("left", "400px")
            .style("top", "0px")
            .style("width", "500px")
            .style("height", "25px")
            .attr("id", "tokenCheckboxContainer");

        var tokenCheckbox = tokenCheckboxContainer
            .selectAll("rect")
            .data(tokenVis)
            .enter()
            .append("rect")
            .attr("id", "tokenCheckbox")
            .attr("fill", function(d, i) {
                TOKEN_COLORS_ARR.push(TOKEN_COLORS(i));
                return lighten(TOKEN_COLORS(i));
            })
            .attr("x", function(d, i) {
                return (i + 1) * CHECKBOX_SIZE;
            })
            .attr("y", top)
            .attr("width", CHECKBOX_SIZE)
            .attr("height", CHECKBOX_SIZE);

        // var token_id = tokenCheckboxContainer
        //     .selectAll("text")
        //     .data(tokenVis)
        //     .enter()
        //     .append("text")
        //     .text(function(d, i) {
        //         return i;      
        //     })
        //     .attr("x", function(d, i) {
        //         return (i + 1) * CHECKBOX_SIZE;
        //     })
        //     .attr("y", top)
        //     .attr("width", CHECKBOX_SIZE)
        //     .attr("height", CHECKBOX_SIZE)
        //     .attr("font-size", "10px")
        //     .style("cursor", "default")
        //     .style("-webkit-user-select", "none")
        //     .attr("dx", 5)
        //     .attr("dy", 2);

        //HEAD_COLORS_ARR.push("#ff052f");

        updateCheckboxes();

        var clickTimeId;
        checkbox.on("click", function(d, i) {
        	if(!token_type_display_flag)
        	{
        		clearTimeout(clickTimeId);
	            clickTimeId = setTimeout(function() {
	                if(headVis[i])
	                {
	                    removeLine(i);
	                }
	                else
	                {
	                    if(browseMode == 1)
	                    {
	                        var svg = d3.select("#vis").select("svg");
	                        drawLineSingleHead(svg, i);
	                    }     
	                }
	                headVis[i] = !headVis[i];       
	                updateCheckboxes();
	            }, 250);  
        	}   
        });

        checkbox.on("dblclick", function(d, i) {
            clearTimeout(clickTimeId);
            clickTimeId = setTimeout(function() {
                for(var j=0; j<nHeads; j++)
                {
                    headVis[j] = false;
                }
                headVis[i] = true;
                if(browseMode == 1)
                {
                    removeLine();
                    var svg = d3.select("#vis").select("svg");
                    drawLineSingleHead(svg, i);
                }
                updateCheckboxes();
            }, 250);   
        });
        

        
        tokenCheckbox.on("click", function(d, i) {
            if(token_type_display_flag)
            {
                clearTimeout(clickTimeId);
                clickTimeId = setTimeout(function() {
                    tokenVis[i] = !tokenVis[i]; 
                    removeLine();  
                    var svg = d3.select("#vis").select("svg");
    				drawLineSingleHead(svg, getSingleActiveHeads()); 
                    updateCheckboxes();
                }, 250);  
            }
        });

        tokenCheckbox.on("dblclick", function(d, i) {
            if(token_type_display_flag)
            {
                clearTimeout(clickTimeId);
                clickTimeId = setTimeout(function() {
                    for(var j=0; j<tokenVis.length; j++)
                    {
                        tokenVis[j] = false;
                    }
                    tokenVis[i] = true;
                    removeLine();
                    var svg = d3.select("#vis").select("svg");
    				drawLineSingleHead(svg, getSingleActiveHeads());
                    updateCheckboxes();
                }, 250);   
            }
        });
    }

    function getActiveHeads() {
        var count = 0;
        for(var i=0; i<nHeads; i++)
        {
            if(headVis[i])
            {
                count++;
            }
        }
        return count;
    }

    function getSingleActiveHeads() {
        var index = -1;
        for(var i=0; i<nHeads; i++)
        {
            if(headVis[i])
            {
                index = i;
            }
        }
        return index;
    }

    function downword() {
        layer = (Number(layer) + 1) % nLayers;
        document.getElementById("layer").selectedIndex = layer; 
        removeLine();
        loadJson(layer, "attn");
    }

    function rightword() {
        if(browseMode == 1)
        {
            var index;
            for(var i=0; i<nHeads; i++)
            {
                if(headVis[i])
                {
                    index = (i + 1) % nHeads;
                }
            }
            for(var i=0; i<headVis.length; i++)
            {
                headVis[i] = false;
            }
            headVis[index] = true; 
            updateCheckboxes();  
            var svg = d3.select("#vis").select("svg");
            removeLine();
            drawLineSingleHead(svg, index);
        }   
    }

    function changeMode() {
        d3.select("#mode").text(browseMode ? "局部模式:": "全局模式:");
        browseMode = !browseMode;    
        if(browseMode == 1)
        {
            $("#5201314").empty();
            var svg = d3.select("#vis").select("svg");
            for(var i=0; i<text.length; i++)
            {
                drawLine(svg, i, true);
            }
        }
        if(browseMode == 0)
        {
            removeLine();
        }
    }

    function allSelect() {
        for(var i=0; i<headVis.length; i++)
        {
            headVis[i] = true;
        }
        updateCheckboxes();
        removeLine();
        if(browseMode == 1)
        {
            var svg = d3.select("#vis").select("svg");
            for(var i=0; i<text.length; i++)
            {
                drawLine(svg, i, true);
            }
        }
    }

    function inverseSelect() {
        for(var i=0; i<headVis.length; i++)
        {
            headVis[i] = !headVis[i];
        }
        updateCheckboxes();
        removeLine();
        if(browseMode == 1)
        {
            var svg = d3.select("#vis").select("svg");
            for(var i=0; i<text.length; i++)
            {
                drawLine(svg, i, true);
            }
        }
    }

    function token_type_display() {
        if(getActiveHeads() == 1 && browseMode == 1)
        {
            token_type_display_flag = !token_type_display_flag;
            d3.select("#button_token_type").text(token_type_display_flag ? "隐藏类型": "显示类型");
            updateCheckboxes();
            removeLine();
            var svg = d3.select("#vis").select("svg");
    		drawLineSingleHead(svg, getSingleActiveHeads());    
        }  
    }

    function initial() {
        var oConsole = document.getElementById('console');
        oConsole.style.position = "fixed";
        oConsole.style.width = "520px";
        oConsole.style.height = "80px";
        oConsole.style.top = "0px";
        $("#layer").empty();
        for (var i = 0; i < nLayers; i++) {
            $("#layer").append($("<option />").val(i).text(i));
        }

        $("#layer").on('change', function(e) {
            layer = e.currentTarget.value;
            removeLine();
            loadJson(layer, "attn");
            //updateCheckboxes();
            var svg = d3.select("#vis").select("svg");
            if(browseMode == 1)
            {
                for(var i=0; i<nHeads; i++)
                {  
                    if(headVis[i])
                    {
                        drawLineSingleHead(svg, i);
                    }
                }
            }
        });
        loadJson(null, "text");
        loadJson(layer, "attn");
        d3.select("#button_down").on("click", downword); 
        d3.select("#button_right").on("click", rightword);   
        d3.select("#button_change").on("click", changeMode);    
        d3.select("#button_all").on("click", allSelect); 
        d3.select("#button_inverse").on("click", inverseSelect); 
        d3.select("#button_token_type").on("click", token_type_display); 
    }

    initial();
});