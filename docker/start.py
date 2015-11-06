#!/usr/bin/python

import os
import sys
import tarfile
import shutil

def run(cmd, fail=True):
	print cmd
	ret = os.system(cmd)
	if fail and ret != 0:
		print "%s (failed with code: %s)" % (cmd, ret)
		sys.exit(ret)
		return ret

tarball = "/tmp/dist/accounts.tar.gz"
dest = '/opt/accounts'

if os.path.exists(tarball):
	if os.path.exists(dest):
		print "Removing old %s" % dest
		shutil.rmtree(dest, ignore_errors=False)

	print "Unpacking %s to: %s" % (tarball, dest)
	with tarfile.open(tarball, 'r:gz') as tf:
		tf.extractall(path=dest)

else:
	print "The accounts.tar.gz distribution archive is missing from the mount: /tmp/dist! Container cannot start."
	sys.exit(1)

olddir = os.getcwd()
os.chdir(os.path.join(dest, 'bundle/programs/server'))

run('/opt/node/bin/npm install')

os.chdir(os.path.join(dest, 'bundle'))

run('/opt/node/bin/node main.js')
