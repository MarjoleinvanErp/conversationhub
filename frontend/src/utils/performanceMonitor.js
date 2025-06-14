class PerformanceMonitor {
  static timers = new Map();
  
  static start(label) {
    this.timers.set(label, {
      start: performance.now(),
      timestamp: new Date().toISOString()
    });
    console.log(`⏱️ START: ${label} - ${this.timers.get(label).timestamp}`);
  }
  
  static end(label) {
    const timer = this.timers.get(label);
    if (!timer) {
      console.warn(`⚠️ No timer found for: ${label}`);
      return;
    }
    
    const duration = performance.now() - timer.start;
    console.log(`✅ END: ${label} - ${duration.toFixed(2)}ms`);
    
    // Warning voor langzame operaties
    if (duration > 1000) {
      console.warn(`🐌 SLOW OPERATION: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    this.timers.delete(label);
    return duration;
  }
  
  static measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  static async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

export default PerformanceMonitor;