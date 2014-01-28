;(function() {

var _filterBar_;

var filterBarExampleData = [
  {
    "groupName": "London Tour",
    "departureDate": "12/18/2013",
    "origin": "IAH",
    "destination": "LHR",
    "status": "CANCELED"
  },
  {
    "groupName": "Swiss Travel",
    "departureDate": "01/13/2014",
    "origin": "JFK",
    "destination": "ZRH",
    "status": "CANCELED"
  },
  {
    "groupName": "Tokyo Tour",
    "departureDate": "01/14/2014",
    "origin": "ORD",
    "destination": "NRT",
    "status": "BOOKED"
  },
  {
    "groupName": "Paris Tour",
    "departureDate": "12/10/2013",
    "origin": "IAH",
    "destination": "CDG",
    "status": "BOOKED"
  },
  {
    "groupName": "Leisure",
    "departureDate": "01/06/2014",
    "origin": "ORD",
    "destination": "ZRH",
    "status": "BOOKED"
  },
  {
    "groupName": "Sports Team",
    "departureDate": "11/13/2013",
    "origin": "LAX",
    "destination": "JFK",
    "status": "BOOKED"
  },
  {
    "groupName": "Tour",
    "departureDate": "01/20/2014",
    "origin": "IAH",
    "destination": "SYD",
    "status": "BOOKED"
  },
  {
    "groupName": "Business",
    "departureDate": "01/09/2014",
    "origin": "CDG",
    "destination": "ZRH",
    "status": "BOOKED"
  },
  {
    "groupName": "Ski Trip",
    "departureDate": "01/30/2014",
    "origin": "JFK",
    "destination": "ZRH",
    "status": "BOOKED"
  }
];

var AIRPORT_CODES = filterBarExampleData.reduce(function(codes, d) {
  if (codes.indexOf(d.origin) === -1) {
    codes.push(d.origin);
  }

  if (codes.indexOf(d.destination) === -1) {
    codes.push(d.destination);
  }

  return codes;
}, []);

function buildFilterBarTableRow(item) {
  var html =
  '<td>' + item.groupName + '</td>' +
  '<td>' + item.departureDate + '</td>' +
  '<td>' + item.origin + '</td>' +
  '<td>' + item.destination + '</td>' +
  '<td>' + item.status + '</td>';

  return '<tr>' + html + '</tr>';
}

function updateFilterBarTable(items) {
  $('#filterBarExampleData').html($.map(items, buildFilterBarTableRow).join(''));
}

function filterExampleData(activeFilters, data) {
  var filtered = [];

  data.forEach(function(d) {
    if (activeFilters.groupName && d.groupName.indexOf(activeFilters.groupName) === -1) return;
    if (activeFilters.departure) {
      var startDate = $.datepicker.parseDate('mm/dd/yy', activeFilters.departure.start);
      var endDate = $.datepicker.parseDate('mm/dd/yy', activeFilters.departure.end);
      var departure = $.datepicker.parseDate('mm/dd/yy', d.departureDate);

      if (departure < startDate || departure > endDate) return;
    }

    if (activeFilters.origin && d.origin !== activeFilters.origin) return;
    if (activeFilters.destination && d.destination !== activeFilters.destination) return;
    if (activeFilters.status && activeFilters.status.indexOf(d.status) === -1) return;

    filtered.push(d);
  });

  return filtered;
}

function init() {
  // Create and configure a new FilterBar instance
  _filterBar_ = new FilterBar('filterBar', [
    { id: 'groupName', label: 'Group Name', type: 'text' },
    { id: 'departure', label: 'Departure', type: 'daterange' },
    { id: 'origin', label: 'Origin', type: 'autocomplete', options: AIRPORT_CODES },
    { id: 'destination', label: 'Destination', type: 'autocomplete', options: AIRPORT_CODES },
    { id: 'status', label: 'Status', type: 'multiselect', options: [
      { value: "BOOKED", label: "Booked" },
      { value: "CANCELED", label: "Canceled" },
      { value: "FLOWN", label: "Flown" }
    ]}
  ]);

  // listen for custom change event
  $('#filterBar').on('filter-bar:change', function() {
    // returns a map of filter id to value
    var activeFilters = _filterBar_.activeFilters();

    updateFilterBarTable(filterExampleData(activeFilters, filterBarExampleData));
  });

  updateFilterBarTable(filterBarExampleData);
}
$(document).ready(init);

})();
