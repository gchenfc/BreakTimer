function getRandomZipfIndex(size, alpha=0.95) {
    // Alpha parameter of Zipf's law. Adjust this to tweak the distribution.

    var zetan = 0;
    var sum = 0;
    var limit = size;
    
    // Calculate Zeta values to normalize
    for (var i = 1; i <= limit; i++) {
        sum += 1.0 / (Math.pow(i, alpha));
    }
    zetan = sum;

    // Choose a random value
    var rand = Math.random();
    sum = 0;

    // Find the corresponding word index
    for (var i = 1; i <= limit; i++) {
        sum += 1.0 / (Math.pow(i, alpha));
        if (sum / zetan >= rand) {
            return i - 1; // return zero-based index
        }
    }

    return size - 1; // In case something goes wrong, return the last index
}
