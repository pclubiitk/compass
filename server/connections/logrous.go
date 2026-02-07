// Set up Logrus with formatting, log levels, file outputs etc.
package connections

import (
	"fmt"
	"path/filepath"
	"runtime"
	"time"

	"github.com/sirupsen/logrus"
)

func logrusConfig() {
	logrus.SetLevel(logrus.DebugLevel) // sets the minimum log level for Logrus.
	// SetReportCaller enables automatic inclusion of the calling function's file name and line number, SetFormatter is used to customize the log format
	logrus.SetFormatter(&logrus.TextFormatter{
		TimestampFormat: time.DateTime, // "2006-01-02 15:04:05"
		FullTimestamp:   true,
		CallerPrettyfier: func(f *runtime.Frame) (string, string) {
			filename := filepath.Base(f.File) // Just the filename
			return "", fmt.Sprintf(" %s:%d", filename, f.Line)
		},
	})
	logrus.SetReportCaller(true)
}
