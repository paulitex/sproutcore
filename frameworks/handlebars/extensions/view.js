sc_require('extensions');

SC.Handlebars.ViewHelper = SC.Object.create({
  helper: function(thisContext, path, options) {
    var inverse = options.inverse;
    var data = options.data;
    var view = data.view;
    var fn = options.fn;

    var newView;
    if (path.isClass || path.isObject) {
     newView = path;
     if (!newView) {
      throw "Null or undefined object was passed to the #view helper. Did you mean to pass a property path string?";
     }
    } else {
      // Path is relative, look it up with this view as the root
      if (path.charAt(0) === '.') {
        newView = SC.objectForPropertyPath(path.slice(1), view);
      } else {
        // Path is absolute, look up path on global (window) object
        newView = SC.objectForPropertyPath(path);
      }
      if (!newView) { throw "Unable to find view at path '" + path + "'"; }
    }

    var currentView = data.view;

    var childViews = currentView.get('childViews');
    var childView = currentView.createChildView(newView);

    // Set the template of the view to the passed block if we got one
    if (fn) { childView.template = fn; }


    childViews.pushObject(childView);

    var context = SC.RenderContext(childView.get('tagName'));

    // Add id and class names passed to view helper
    this.applyAttributes(options.hash, childView, context);

    childView.applyAttributesToContext(context);


    // tomdale wants to make SproutCore slow
    childView.render(context, YES);

    return new Handlebars.SafeString(context.join());
  },

  applyAttributes: function(options, childView, context) {
    var id = options.id;
    var classNames = options['class'];

    if (classNames) {
      context.addClass(classNames.split(' '));
    }

    if (id) {
      childView.set('layerId', id);
      context.id(id);
    }

    var classBindings = options.classBinding;
    if (classBindings) {
      SC.Handlebars.bindClasses(childView, classBindings).forEach(function(className) {
        context.setClass(className, YES);
      });
    }
  }
});


Handlebars.registerHelper('view', function(path, options) {
  return SC.Handlebars.ViewHelper.helper(this, path, options);
});
