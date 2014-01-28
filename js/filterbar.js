//
// Dependencies
//
// daterange filter inputs require jQuery UI datepicker
// autocomplete filter inputs require twitter typeahead
// chosen filter inputs requires Chosen.js
//

// start anonymous wrapper
;(function() {

'use strict';

window.FilterBar = window.FilterBar ||
function(containerElOrId, cfg) { // start window.FilterBar

function error(msg) {
  window.console.log('Filter Bar: ' + msg);
}

var widget = {}; // constructor return object
var containerEl;

// make a deep copy of the configuration so we can't mess up the caller's copy
var CONFIG = JSON.parse(JSON.stringify(cfg));

//-----------------------------------------------------------------------------
// Stateful Variables
//-----------------------------------------------------------------------------

// state of all filters
var _filters_ = {};

//-----------------------------------------------------------------------------
// Filter Input Types
//-----------------------------------------------------------------------------

function optionLabel(filter) {
  var opts = filter.options;
  for (var i=0, len=opts.length; i<len; i++) {
    if (opts[i].value === filter.value) break;
  }

  if (i === len) return '';

  var selectedOption = filter.options[i];

  return selectedOption.label || selectedOption.value;
}

var INPUT_TYPES = {};
INPUT_TYPES.text = {
  build: function() {
    return '<input type="text" class="filter-text-input" />';
  },
  getValue: function(filterBoxEl) {
    return filterBoxEl.find('.filter-text-input').val();
  },
  renderDisplay: function(filter) {
    return filter.value;
  }
};

INPUT_TYPES.singleselect = {
  build: function(options) {
    return '<ul class="filter-single-select">' + options.map(buildSelectOption).join('') + '</ul>';
  },
  getValue: function(filterBoxEl) {
    return filterBoxEl.find('li.filter-option.checked').attr('data-option-value');
  },
  renderDisplay: optionLabel
};

INPUT_TYPES.multiselect = {
  build: function(options) {
    return '<ul class="filter-multi-select">' + options.map(buildSelectOption).join('') + '</ul>';
  },
  getValue: function(filterBoxEl) {
    var checkedOpts = filterBoxEl.find('li.filter-option.checked');
    var values = checkedOpts.map(function() {
      return $(this).attr('data-option-value');
    }).toArray();

    return values;
  },
  renderDisplay: function(filter) {
    var selectedValues = filter.value;
    var labels = [];
    filter.options.forEach(function(o) {
      if (selectedValues.indexOf(o.value) !== -1) {
        labels.push(o.label);
      }
    });

    return labels.join(', ');
  }
};

INPUT_TYPES.daterange = {
  build: function() {
    return buildDateRangeCol('start') + buildDateRangeCol('end');
  },
  getValue: function(filterBoxEl) {
    return {
      start: filterBoxEl.find('.filter-daterange-start .datepicker-value').val(),
      end: filterBoxEl.find('.filter-daterange-end .datepicker-value').val()
    };
  },
  renderDisplay: function(filter) {
    var value = filter.value;
    if (value.start.length === 0 && value.end.length === 0) return '';
    if (value.start === value.end) return formatDate(value.start);

    return formatDate(value.start) + ' - ' + formatDate(value.end);
  }
};

INPUT_TYPES.autocomplete = {
  build: function() {
    return '<input type="text" class="filter-autocomplete-input" />';
  },
  getValue: function(filterBoxEl) {
    return filterBoxEl.find('.filter-autocomplete-input').val();
  },
  renderDisplay: function(filter) {
    return optionLabel(filter).toUpperCase();
  }
};

INPUT_TYPES.chosen = {
  build: function(options) {
    return '<select class="filter-chosen-input">' +
      options.map(buildChosenOption).join('') + '</select>';
  },
  getValue: function(filterBoxEl) {
    return filterBoxEl.find('.filter-chosen-input').val();
  },
  renderDisplay: optionLabel
};

//-----------------------------------------------------------------------------
// General Functionality
//-----------------------------------------------------------------------------

function hideFilterBoxes() {
  containerEl.find('.filter-box').hide();
  $('.filter-box-arrow-override-b5371').remove();
}

function refreshActiveFilters() {
  $('.filter-box').each(function() {
    var boxEl = $(this);
    var filter = _filters_[boxEl.attr('data-filter-id')];
    filter.value = INPUT_TYPES[filter.type].getValue(boxEl);
  });

  var filterBlocks = $.map(_filters_, buildFilterBlock).join('');

  containerEl.find('.filter-bar-bottom').html(
    filterBlocks.length > 0 ? filterBlocks :
                            '<div class="no-filters">No Active Filters</div>');

  containerEl.trigger('filter-bar:change', [widget.activeFilters()]);
}

function clearAllFilters() {
  _filters_ = {};
  CONFIG.forEach(function(f) {
    _filters_[f.id] = $.extend({}, f, {
      value: ''
    });
  });

  containerEl.find('.filter-block').remove();
}

function activeFilters() {
  var values = {};
  containerEl.find('.filter-block').each(function() {
    var blockEl = $(this);
    var filterId = blockEl.attr('data-filter-id');
    values[filterId] = _filters_[filterId].value;
  });

  // deep copy to keep caller from messing with value references
  return JSON.parse(JSON.stringify(values));
}

function formatDate(date) {
  var parsedDate = $.datepicker.parseDate('mm/dd/yy', date);
  return $.datepicker.formatDate('M d, yy', parsedDate);
}

function setFilterBoxArrowPosition(arrowLeft) {
  $('.filter-box-arrow-override-b5371').remove();
  $('head').append(
    '<style class="filter-box-arrow-override-b5371">' +
      '.filter-box:before, .filter-box:after { left: ' + arrowLeft + 'px; }' +
    '</style>');
}

// http://stackoverflow.com/a/7124052/382373
function htmlEscape(str) {
  return String(str)
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

//-----------------------------------------------------------------------------
// Templates
//-----------------------------------------------------------------------------

function buildSelectOption(option) {
  var html =
  '<li class="filter-option" data-option-value="' + option.value +
  // Using font awesome 3.x and 4.x class names for backwards compatibility
   '"><i class="icon-check fa fa-check-square-o"></i><i class="icon-check-empty fa fa-square-o"></i>' + option.label +
  '</li>';

   return html;
}

function buildChosenOption(option) {
  return '<option value="' + option.value +'">' + option.label + '</option>';
}

function buildDateRangeCol(type) {
  var html =
  '<div class="filter-daterange-col filter-daterange-' + type + '">' +
    '<label class="filter-daterange-label">' + type +
      '<input type="text" class="datepicker-value" />' +
    '</label>' +
    '<div class="clearfix"></div>' +
    '<div class="datepicker"></div>' +
  '</div>';

  return html;
}

function buildFilter(filter) {
  var html =
  '<span class="filter-link" data-filter-id="' + filter.id + '">' +
    filter.label +
  '</span>' +
  buildFilterBox(filter);

  return html;
}

function buildFilterBox(filter) {
  var html =
  '<div data-filter-id="' + filter.id + '" ' +
  'class="filter-box filter-box-' + filter.type + ' "' +
  'style="display:none">' +
    INPUT_TYPES[filter.type].build(filter.options) +
  '</div>';

  return html;
}

function buildWidget() {
  var html =
  '<div class="filter-bar-inner">' +
  '<div class="filter-bar-top">' +
    '<span class="filter-by-label">Filter by: </span>' + CONFIG.map(buildFilter).join('') +
  '</div>' +
  '<div class="filter-bar-bottom"></div>' +
  '</div>';

  return html;
}

function buildFilterBlock(filter) {
  var displayValue = INPUT_TYPES[filter.type].renderDisplay(filter);

  if (! displayValue) return '';

  var html =
  '<div class="filter-block" data-filter-id="' + filter.id + '">' +
    '<span class="filter-block-label">' + filter.label + ':</span>' +
    '<span class="filter-block-value">' + htmlEscape(displayValue) + '</span>' +
    '<span class="filter-block-remove">✕</span>' +
  '</div>';

  return html;
}

//-----------------------------------------------------------------------------
// Events
//-----------------------------------------------------------------------------

function addEvents() {
  $(document).on('mousedown', mousedownDocument);

  // attach events to inner element so clearing the container will remove events
  containerEl.find('.filter-bar-inner')
    .on('click', '.filter-link', clickFilterLink)
    .on('change', '.filter-text-input', refreshActiveFilters)
    .on('change', '.datepicker-value', changeDatepickerValue)
    .on('click', '.filter-block-remove', clickFilterBlockRemove)
    .on('click', 'ul.filter-single-select .filter-option', clickSingleSelect)
    .on('click', 'ul.filter-multi-select .filter-option', clickMultiSelect)
    .on('typeahead:selected change','.filter-autocomplete-input',refreshActiveFilters)
    .on('keyup', '.filter-text-input', keyupTextField)
    .on('change', '.filter-chosen-input', changeChosenInput);
}

function changeChosenInput() {
  hideFilterBoxes();
  refreshActiveFilters();
}

function keyupTextField(e) {
  if (e.which === 13) {
    $(e.currentTarget).parents('.filter-box').hide();
  }
}

function clickSingleSelect(e) {
  $(e.currentTarget)
    .toggleClass('checked')
    .siblings('li.filter-option').removeClass('checked');

  refreshActiveFilters();
}

function clickMultiSelect(e) {
  $(e.currentTarget).toggleClass('checked');
  refreshActiveFilters();
}

function changeDatepickerValue(e) {
  // initialize the empty date field to the value
  // of the first date selected on either calendar
  var inputEl = $(e.currentTarget);
  var newDate = inputEl.val();
  inputEl.parents('.filter-box').find('.datepicker-value').each(function() {
    var el = $(this);
    if (el.val().length === 0) {
      el.val(newDate);
    }
  });

  refreshActiveFilters();
}

function clearFilter(filterId) {
  var filter = _filters_[filterId];
  var filterBoxEl = containerEl.find('.filter-box[data-filter-id=' +
    filterId + ']');

  if (filter.type === 'daterange') {
    filterBoxEl.find('.datepicker').datepicker('setDate', null);
  }
  else if (filter.type === 'autocomplete') {
    filterBoxEl.find('input').val('');
  }
  else if (filter.type === 'chosen') {
    filterBoxEl.find('select').val('');
  }
  else {
    filterBoxEl.replaceWith(buildFilterBox(filter));
  }
}

function clickFilterBlockRemove(e) {
  var filterBlockEl = $(e.currentTarget).parents('.filter-block');
  var filterId = filterBlockEl.attr('data-filter-id');

  clearFilter(filterId);
  refreshActiveFilters();
}

function mousedownDocument(e) {
  var targetEl = $(e.target);

  // check if user clicked inside THIS filter box
  if (targetEl.closest(containerEl).length > 0) {
    // do nothing if they clicked on a filter link
    if (targetEl.hasClass('filter-link') === true) return;

    // do nothing if they clicked inside a filter box
    if (targetEl.closest('.filter-box').length >= 1) return;
  }

  // else hide the filter boxes
  hideFilterBoxes();
}

function clickFilterLink(e) {
  hideFilterBoxes();

  var linkEl = $(e.currentTarget);
  var filterId = linkEl.attr('data-filter-id');
  var boxEl = containerEl.find('.filter-box[data-filter-id=' + filterId + ']');

  // center the box's arrow on the link and
  // prevent the box from appearing farther left than the "Filter by" text
  var linkCenter = linkEl.position().left + linkEl.outerWidth(true) / 2;
  var calculatedBoxLeft = linkCenter - boxEl.outerWidth(true) / 2;
  var filterByLeft = containerEl.find('.filter-by-label').position().left;
  var boxLeft = Math.max(calculatedBoxLeft, filterByLeft);

  if (boxLeft === filterByLeft) {
    setFilterBoxArrowPosition(linkCenter - filterByLeft);
  }

  boxEl.css('left', boxLeft).show();
  setTimeout(function() {
    boxEl.find('.filter-chosen-input').trigger('chosen:open');
    boxEl.height(boxEl.find('.chosen-drop').height());
  }, 0);
}

//-----------------------------------------------------------------------------
// Initialization
//-----------------------------------------------------------------------------

function initDatepickers() {
  var dateRangeEls = $('.filter-daterange-col');

  if (dateRangeEls.length === 0) return;

  if (typeof $.fn.datepicker !== 'function') {
    error('datepicker plugin not found!');
    return;
  }

  // initialize each datepicker to update the input box above each calendar
  dateRangeEls.each(function() {
    var colEl = $(this);
    var inputEl = colEl.find('.datepicker-value');
    colEl.find('.datepicker').datepicker({
      altField: inputEl,
      defaultDate: null,
      prevText: '◀', // prevText and nextText are required for the
      nextText: '▶', // prev/next arrow to display correctly. (Fix this)
      onSelect: function() {
        $(inputEl).change(); // trigger change event on the target input field
      }
    })
    .datepicker('setDate', null); // Clear the initial date
  });
}

function initAutocomplete() {
  var autocompleteEls = $('.filter-autocomplete-input');

  if (autocompleteEls.length === 0) return;

  if (typeof $.fn.typeahead !== 'function') {
    error('typeahead plugin not found!');
    return;
  }

  autocompleteEls.each(function() {
    var inputEl = $(this);
    var filterId = inputEl.parents('.filter-box').attr('data-filter-id');
    var options = _filters_[filterId].options;

    inputEl.typeahead({
      name: 'options',
      limit: 5,
      local: options
    });
  });
}

function initChosen() {
  var chosenEls = $('.filter-chosen-input');

  if (chosenEls.length === 0) return;

  if (typeof $.fn.chosen !== 'function') {
    error('chosen plugin not found!');
    return;
  }

  chosenEls.each(function() {
    var selectEl = $(this);
    selectEl.chosen({
      // chosen doesn't automatically pick up width of hidden selects :(
      // TODO: This is not working right
      width: selectEl.width() + 'px'
    });
  });
}

function initDom() {
  containerEl.html(buildWidget());
  initDatepickers();
  initAutocomplete();
  initChosen();
}

function validateConfig() {
  if (typeof containerElOrId === 'string') {
    containerEl = $(document.getElementById(containerElOrId));
  }
  else {
    containerEl = $(containerElOrId);
  }

  if (containerEl.length === 0) {
    error('Invalid container element');
    return false; // received a bogus containerElOrId arg
  }

  if (! $.isArray(CONFIG)) {
    error('Invalid filters configuration');
    return false;
  }

  var requiredFilterProps = ['id', 'label', 'type'];

  // expands any shorthand strings to full option object
  var expandSelectOption = function(o) {
    if (typeof o === 'string') {
      return {
        value: o,
        label: o
      };
    }

    return o;
  };

  var expandAutocompleteOptions = function(o) {
    return { value: o, tokens: [o] };
  };

  for (var i=0; i<CONFIG.length; i++) {
    var filterCfg = CONFIG[i];
    for (var j=0; j<requiredFilterProps.length; j++) {
      if (! filterCfg[requiredFilterProps[j]]) {
        error('Missing required filter property');
        return false;
      }
    }

    if (! INPUT_TYPES[filterCfg.type]) {
      error('Unknown filter type: ' + filterCfg.type);
      return false;
    }

    // requires options config
    if (['multiselect', 'singleselect', 'chosen'].indexOf(filterCfg.type) !== -1) {
      if (! filterCfg.hasOwnProperty('options')) {
        error('select filter config did not specify any options');
        return false;
      }

      if (filterCfg.type === 'chosen') {
        filterCfg.options.unshift(''); // chosen needs a empty selection
      }
      filterCfg.options = filterCfg.options.map(expandSelectOption);

    }

    if (filterCfg.type === 'autocomplete') {
      if (! filterCfg.hasOwnProperty('options')) {
        error('autocomplete filter config did not specify any options');
        return false;
      }

      filterCfg.options = filterCfg.options.map(expandAutocompleteOptions);
    }
  }

  return true;
}

function init() {
  validateConfig();
  clearAllFilters();
  initDom();
  refreshActiveFilters();
  addEvents();
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------
widget.clear = clearAllFilters;
widget.activeFilters = activeFilters;

init();

return widget;

}; // end window.FilterBar

})();
// end anonymous wrapper
