  var path = require('path');

module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  /**
   * Resolve external project resource as file path
   */
  function resolvePath(project, file) {
    return path.join(path.dirname(require.resolve(project)), file);
  }


  grunt.initConfig({
    browserify: {
      options: {
        browserifyOptions: {
          debug: true
        },
        transform: [
          [ 'stringify', {
            extensions: [ '.bpmn' ]
          } ]
        ],
        plugin: [
          'esmify'
        ]
      },
      watch: {
        options: {
          watch: true
        },
        files: {
          'dist/index.js': [ 'app/**/*.js' ]
        }
      },
      app: {
        files: {
          'dist/index.js': [ 'app/**/*.js' ]
        }
      }
    },

    copy: {
      diagram_js: {
        files: [
          {
            src: resolvePath('diagram-js', 'assets/diagram-js.css'),
            dest: 'dist/css/diagram-js.css'
          }
        ]
      },
      bpmn_js: {
        files: [
          {
            expand: true,
            cwd: resolvePath('bpmn-js', 'dist/assets'),
            src: ['**/*.*', '!**/*.js'],
            dest: 'dist/vendor'
          }
        ]
      },
      bpmn_js_token_simulation: {
        files: [
          {
            src: resolvePath('bpmn-js-token-simulation', 'assets/css/bpmn-js-token-simulation.css'),
            dest: 'dist/css/bpmn-js-token-simulation.css'
          }
        ]
      },
      app: {
        files: [
          {
            expand: true,
            cwd: 'app/',
            src: ['**/*.*', '!**/*.js'],
            dest: 'dist'
          }
        ]
      },
      styles: {
        files: {
          'dist/css/resource.css': 'styles/resource.css',
          'dist/css/panel.css': 'styles/panel.css'
        }
      }
    },

    less: {
      options: {
        dumpLineNumbers: 'comments',
        paths: [
          'node_modules'
        ]
      },

      styles: {
        files: {
          'dist/css/app.css': 'styles/app.less'
        }
      }
    },

    watch: {
      options: {
        livereload: true
      },

      samples: {
        files: [ 'app/**/*.*' ],
        tasks: [ 'copy:app' ]
      },

      less: {
        files: [
          'styles/**/*.less',
          'node_modules/bpmn-js-properties-panel/styles/**/*.less'
        ],
        tasks: [
          'less'
        ]
      },
    },

    connect: {
      livereload: {
        options: {
          port: 9013,
          livereload: true,
          hostname: 'localhost',
          open: true,
          base: [
            'dist'
          ]
        }
      }
    }
  });

  // tasks

  grunt.registerTask('build', [ 'copy', 'less', 'browserify:app' ]);

  grunt.registerTask('auto-build', [
    'copy',
    'less',
    'browserify:watch',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('default', [ 'build' ]);
};
