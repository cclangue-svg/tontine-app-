const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

module.exports = supabase;
