import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return ['Donatello', 'Leonardo', 'Mikilangelo', 'Rafael'];
    }
});
