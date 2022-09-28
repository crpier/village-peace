from python:3.10.7

RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH $PATH:/root/.local/share/pypoetry/venv/bin

COPY ./pyproject.toml ./poetry.lock* ./
RUN poetry config virtualenvs.create false
RUN poetry install --no-root --only main


COPY . /src
WORKDIR /src
ENV PYTHONPATH /src
CMD ["python", "app/main.py"]
