/*
 * 
 * 
 *
 * Copyright (c) 2017 
 * Licensed under the MIT license.
 */
(function ($) {
  $.fn.RiskShowDashboard = function () {
    return this.each(function (i) {
      // Do something to each selected element.
      $(this).html('RiskShowDashboard' + i);
    });
  };
}(jQuery));
