// ==========================================================================
// Project:   SproutCore Costello - Property Observing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple, Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

require('mixins/enumerable') ;
require('mixins/observable') ;

/**
  @class 

  A collection of ranges.  You can use an IndexSet to keep track of non-
  continuous ranges of items in a parent array.  IndexSet's are used for 
  selection, for managing invalidation ranges and other data-propogation.

  h2. Examples
  
  {{{
    var set = SC.IndexSet.create(ranges) ;
    set.contains(index);
    set.add(index, length);
    set.remove(index, length);
    
    // uses a backing SC.Array object to return each index
    set.forEach(function(object) { .. })
    
    // returns the index
    set.forEachIndex(function(index) { ... });
    
    // returns ranges
    set.forEachRange(function(start, length) { .. });
  }}}

  h2. Implementation Notes

  An IndexSet stores indices on the object.  A positive value great than the
  index tells you the end of an occupied range.  A negative values tells you
  the end of an empty range.  A value less than the index is a search 
  accelerator.  It tells you the start of the nearest range.

  @extends Object
  @extends SC.Enumerable 
  @extends SC.Observable
  @since SproutCore 1.0
*/
SC.IndexSet = function(ranges) {
  this.initObservable();
  this._content = [0];
  return this ;
} ;

SC.IndexSet.prototype = SC.mixin({}, SC.Enumerable, SC.Observable, {

  _last: 0 ,
  
  /**
    Total number of indexes contained in the set

    @type number
  */
  length: 0,

  /** 
    Returns the starting index of the nearest range for the specified 
    index.
    
    @param {Number} index
    @returns {Number} starting index
  */
  rangeStartForIndex: function(index) {    
    var content = this._content;
    
    // fast cases
    if (index >= this._last) return this._last ;
    if (content[index] > 0) return index ; // we hit a border
    
    // use accelerator to find nearest content range
    var ret  = content[index - (index % 256)],
        next = Math.abs(content[ret]);
    
    while (next < index) {
      ret = next ;
      next = Math.abs(content[ret]);
    }
    return ret ;
  },
    
  /**
    Returns YES if the index set contains the named index
    
    @param {Number} start index or range
    @param {Number} length optional range length
    @returns {Boolean}
  */
  contains: function(start, length) {

    // normalize input
    if (length === undefined) { 
      if (typeof start === SC.T_NUMBER) {
        length = 1 ;
      } else {
        length = start.length; 
        start = start.start;
      }
    }
    
    var rstart = this.rangeStartForIndex(start),
        rnext  = this._content[rstart];
    
    return (rnext>0) && (rstart <= start) && (rnext >= (start+length));
  },
  
  /**
    Adds the specified range of indexes to the set
    
    @param {Number} start index or Range
    @param {Number} length optional length of range. 
    @returns {SC.IndexSet} receiver
  */
  add: function(start, length) {
    
    // normalize input
    if (length === undefined) { 
      if (typeof start === SC.T_NUMBER) {
        length = 1 ;
      } else {
        length = start.length; 
        start = start.start;
      }
    }

    // special case - appending to end of set
    var last    = this._last,
        content = this._content,
        hstart, hlength;
        
    if (start > last) {
      content[last] = 0-start; // empty!
      content[start] = start+length ;
      content[start+length] = 0; // set end
      this._last = start + length ;
      this.set('length', this.length + length) ;
      
      // affected range goes from starting range to end of content.
      hstart = last ;
      hlength = this._last - hstart;
      
    // otherwise, merge into existing range
    } else {

      // find the starting range
    }
    
    this._hint(hstart, hlength);
    this.enumerableContentDidChange(start, length);
    return this;
  },
  
  /** @private 
    iterates through a named range, setting hints every HINT_SIZE indexes 
    pointing to the nearest range start.  The passed range must start on a
    range boundary.  It can end anywhere.
  */
  _hint: function(start, length) {
    var content = this._content,
        skip    = SC.IndexSet.HINT_SIZE,
        next    = Math.abs(content[start]), // start of next range
        loc     = start - (start % skip) + skip, // next hint loc
        lim     = start + length ; // max
        
    while (loc < lim) {
      // make sure we are in current rnage
      while (next <= loc) {
        start = next ; 
        next  = Math.abs(content[start]) ;
      }
      
      // do not change if on actual boundary
      if (loc !== start) content[loc] = start ; 
      loc += skip;
    }
  },

  // 
  //   /**
  //     Clears the set 
  //   */
  //   clear: function() { this.length = 0; },
  // 
  //   /**
  //     Quicky determine if the specified index is part of the set.
  //   */
  //   contains: function(index) {
  //     
  //   },
  // 
  //   /**
  //     Call this method to add an object. performs a basic add.
  // 
  //     If the object is already in the set it will not be added again.
  // 
  //     @param {Number} start the starting index
  //     @param {Number} length optional length. defaults to 1
  //     @returns {SC.IndexSet} receiver
  //   */
  //   add: function(start, length) {
  //     if (length === 0) return this ; // nothing to do
  //     if (!length) length = 1; // assume default
  // 
  //     
  //     return this ;
  //   },
  // 
  //   /**
  //     Add all the items in the passed array.
  //   */
  //   addEach: function(objects) {
  //     var idx = objects.get('length') ;
  //     if (objects.objectAt) {
  //       while(--idx >= 0) this.add(objects.objectAt(idx)) ;
  //     } else {
  //       while(--idx >= 0) this.add(objects[idx]) ;
  //     }
  //     return this ;
  //   },  
  // 
  //   /**
  //     Removes the object from the set if it is found.
  // 
  //     If the object is not in the set, nothing will be changed.
  // 
  //     @param obj {Object} the object to remove
  //     @returns {this} this
  //   */  
  //   remove: function(obj) {
  // 
  //     if (SC.none(obj)) return this ;
  //     var guid = SC.hashFor(obj);
  //     var idx = this[guid] ;
  //     var len = this.length;
  // 
  //     if (SC.none(idx) || (idx >= len)) return this; // not in set.
  // 
  //     // clear the guid key
  //     delete this[guid] ;
  // 
  //     // to clear the index, we will swap the object stored in the last index.
  //     // if this is the last object, just reduce the length.
  //     if (idx < (len-1)) {
  //       obj = this[idx] = this[len-1];
  //       this[SC.hashFor(obj)] = idx ;
  //     }
  // 
  //     // reduce the length
  //     this.length = len-1;
  //     return this ;
  //   },
  // 
  //   /**
  //     Removes an arbitrary object from the set and returns it.
  // 
  //     @returns {Object} an object from the set or null
  //   */
  //   pop: function() {
  //     var obj = (this.length > 0) ? this[this.length-1] : null ;
  //     if (obj) this.remove(obj) ;
  //     return obj ;
  //   },
  // 
  //   /**
  //     Removes all the items in the passed array.
  //   */
  //   removeEach: function(objects) {
  //     var idx = objects.get('length') ;
  //     if (objects.objectAt) {
  //       while(--idx >= 0) this.remove(objects.objectAt(idx)) ;
  //     } else {
  //       while(--idx >= 0) this.remove(objects[idx]) ;
  //     }
  //     return this ;
  //   },  
  // 
  //   /**
  //    Clones the set into a new set.  
  //   */
  //   clone: function() {
  //     return SC.Set.create(this);    
  //   },
  // 
  
  /**
    Returns a string describing the internal range structure.  Useful for
    debugging.
    
    @returns {String}
  */
  inspect: function() {
    var content = this._content,
        len     = content.length,
        idx     = 0,
        ret     = [],
        item;
    
    for(idx=0;idx<len;idx++) {
      item = content[idx];
      if (item !== undefined) ret.push("%@:%@".fmt(idx,item));      
    }
    return "SC.IndexSet<%@>".fmt(ret.join(' , '));
  },
  
  // .......................................
  // PRIVATE 
  //

  /** @private - support iterators */
  nextObject: function(ignore, idx, context) {
    var content = this._content,
        next    = context.next; // next boundary
    
    // seed.
    if (idx === null) {
      idx = next = 0 ;

    } else if (idx >= this._last) {
      return null ; // nothing left to do

    } else idx++; // look on next index
    
    // look for next non-empty range if needed.
    if (idx === next) {
      do { 
        idx = Math.abs(next);
        next = content[idx];
      } while(next < 0);
      context.next = next;
    }
    
    return idx;
  },
  
  toString: function() {
    return "SC.IndexSet<%@>".fmt(SC.$A(this)) ;
  }  

}) ;

SC.IndexSet.prototype.slice = SC.IndexSet.prototype.clone ;

SC.IndexSet.prototype.push = SC.IndexSet.prototype.unshift = SC.IndexSet.prototype.add ;
SC.IndexSet.prototype.shift = SC.IndexSet.prototype.pop ;

SC.IndexSet.HINT_SIZE = 256;

/**
  To create a set, pass an array of items instead of a hash.
*/
SC.IndexSet.create = function(items) { return new SC.IndexSet(items); };
