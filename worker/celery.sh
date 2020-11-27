echo purge
venv/bin/celery purge -f -A app.celery
echo purged
venv/bin/celery worker -A app.celery -c 2 --loglevel=info
