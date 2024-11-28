document.addEventListener("DOMContentLoaded", () => {
    let data = []; 
    let filteredData = []; 

    // Load the JSON data file
    fetch("data.json")
        .then(response => response.json())
        .then(json => {
            data = json; 
            populateFilters(data);
            updateTable(data);
            updateMetrics(data);
            renderChart(data);
        });

    // Populate filter dropdowns
    function populateFilters(data) {
        const years = [...new Set(data.map(item => item.YEAR))];
        const months = [...new Set(data.map(item => item.MONTH))];
        const cities = [...new Set(data.map(item => item.City))];
        const customers = [...new Set(data.map(item => item.CustomerDescr))];

        populateDropdown('year', years);
        populateDropdown('month', months);
        populateDropdown('city', cities);
        populateDropdown('customer', customers);
    }

    function populateDropdown(id, values) {
        const select = document.getElementById(id);
        values.sort().forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        select.addEventListener("change", filterData);
    }

    // Filter data and update UI
    function filterData() {
        const year = document.getElementById('year').value;
        const month = document.getElementById('month').value;
        const city = document.getElementById('city').value;
        const customer = document.getElementById('customer').value;

        filteredData = data.filter(item => {
            return (!year || item.YEAR == year) &&
                   (!month || item.MONTH == month) &&
                   (!city || item.City == city) &&
                   (!customer || item.CustomerDescr == customer);
        });

        updateTable(filteredData);
        updateMetrics(filteredData);
        renderChart(filteredData);
    }

    // Update table with filtered data
    function updateTable(data) {
        if ($.fn.DataTable.isDataTable('#data-table')) {
            $('#data-table').DataTable().destroy();
        }

        $('#data-table').DataTable({
            data: data,
            columns: [
                { data: 'YEAR', title: 'YEAR', width: '50px' },
                { data: 'MONTH', title: 'MONTH', width: '50px' },
                { data: 'DAY', title: 'DAY', width: '50px' },
                { data: 'Customer', title: 'Customer', width: '100px' },
                { data: 'CustomerDescr', title: 'Customer Description', width: '150px' },
                { data: 'City', title: 'City', width: '100px' },
                { data: 'Salesorg', title: 'Salesorg', width: '100px' },
                { data: 'Country', title: 'Country', width: '100px' },
                { data: 'OrderNumber', title: 'Order Number', width: '100px' },
                { data: 'OrderItem', title: 'Order Item', width: '100px' },
                { data: 'Product', title: 'Product', width: '100px' },
                { data: 'ProductDescr', title: 'Product Description', width: '150px' },
                { data: 'Product Category', title: 'Product Category', width: '150px' },
                { data: 'Division', title: 'Division', width: '100px' },
                { data: 'SalesQuantity', title: 'Sales Quantity', width: '50px' },
                { data: 'UnitOfMeasure', title: 'Unit of Measure', width: '50px' },
                { data: 'Revenue', title: 'Revenue', width: '100px' },
                { data: 'Currency', title: 'Currency', width: '100px' },
                { data: 'Discount', title: 'Discount', width: '100px' },
                { data: 'CostOfGoodsManufactured', title: 'Cost of Goods Manufactured', width: '150px' },
                { data: 'Revenue USD', title: 'Revenue USD', width: '100px' },
                { data: 'Discount USD', title: 'Discount USD', width: '100px' },
                { data: 'Cogm USD', title: 'Cogm USD', width: '100px' }
            ],
            order: [[0, 'asc']],
            pageLength: 10,
            responsive: true,
            deferRender: true
        });
    }

    // Update metrics
    function updateMetrics(data) {
        const totalRevenue = d3.sum(data, d => d.Revenue);
        const totalSales = d3.sum(data, d => d.SalesQuantity);
        const avgDiscount = data.length ? (d3.mean(data, d => d.Discount)) : 0;

        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('total-sales').textContent = totalSales;
        document.getElementById('avg-discount').textContent = `${avgDiscount.toFixed(2)}%`;
    }

    function renderChart(data) {
        const groupedData = d3.group(data, d => d.YEAR, d => d.MONTH);
        const years = Array.from(groupedData.keys());
        const months = Array.from(new Set(data.map(item => item.MONTH)));

        const revenueByYearMonth = [];
        years.forEach(year => {
            months.forEach(month => {
                const revenue = d3.sum(groupedData.get(year).get(month) || [], d => d.Revenue);
                revenueByYearMonth.push({ year, month, revenue });
            });
        });

        d3.select("#sales-chart").selectAll("*").remove();

        const svg = d3.select("#sales-chart")
            .attr("viewBox", `0 0 800 400`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("background-color", "#fff");

        const margin = { top: 30, right: 30, bottom: 60, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const x0 = d3.scaleBand()
            .domain(years)
            .range([margin.left, width - margin.right])
            .paddingInner(0.1);

        const x1 = d3.scaleBand()
            .domain(months)
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(revenueByYearMonth, d => d.revenue)]).nice()
            .range([height - margin.bottom, margin.top]);

        const color = d3.scaleOrdinal()
            .domain(months)
            .range(d3.schemeCategory10);

        svg.append("g")
            .selectAll("g")
            .data(revenueByYearMonth)
            .enter().append("g")
            .attr("transform", d => `translate(${x0(d.year)},0)`)
            .selectAll("rect")
            .data(d => months.map(month => ({ year: d.year, month, revenue: d.revenue })))
            .enter().append("rect")
            .attr("x", d => x1(d.month))
            .attr("y", d => y(d.revenue))
            .attr("width", x1.bandwidth())
            .attr("height", d => y(0) - y(d.revenue))
            .attr("fill", d => color(d.month));

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y));

        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right + margin.left},${margin.top})`);

        legend.selectAll("rect")
            .data(months)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => color(d));

        legend.selectAll("text")
            .data(months)
            .enter().append("text")
            .attr("x", 20)
            .attr("y", (d, i) => i * 20 + 9)
            .text(d => d)
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");
    }
});
