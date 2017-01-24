(function ($) {
  module('jQuery#RiskShowDashboard', {
    setup: function () {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is chainable', function () {
    expect(1);
    strictEqual(this.elems.RiskShowDashboard(), this.elems, 'should be chainable');
  });

  test('is RiskShowDashboard', function () {
    expect(1);
    strictEqual(this.elems.RiskShowDashboard().text(), 'RiskShowDashboard0RiskShowDashboard1RiskShowDashboard2', 'should be RiskShowDashboard');
  });

}(jQuery));
