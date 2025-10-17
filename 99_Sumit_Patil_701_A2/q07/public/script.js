$(document).ready(function() {
  $('.cart-form').submit(function(e) {
    e.preventDefault();
    const productId = $(this).find('input[name="productId"]').val();
    $.post('/cart/add', { productId }, function() {
      alert('Added to cart');
    }).fail(function() {
      alert('Error adding to cart');
    });
  });
});