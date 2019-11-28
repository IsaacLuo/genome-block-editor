FROM python:3.8
WORKDIR /app
# RUN apt update
# RUN apt install -y gunicorn
RUN pip install gunicorn
ADD . .
RUN pip install -r requirements.txt
