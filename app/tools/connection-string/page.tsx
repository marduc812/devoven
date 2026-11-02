import type { Metadata } from 'next';
import { ConnectionStringBuilder } from '@/Components/Functions/ConnectionStringTools';
import ToolArticle from '@/Components/MainView/MainPanel/ToolArticle';
import { toolMetadata } from '@/lib/seo';

export const metadata: Metadata = toolMetadata('/tools/connection-string', {
  title: 'Database connection string builder for Python | DevOven',
  description:
    'Build PostgreSQL, MySQL, MongoDB, and Redis connection strings online. Copy Python SQLAlchemy, psycopg2, PyMongo, or redis-py formats in your browser.',
});

export default function Page() {
  return (
    <ConnectionStringBuilder
      article={
        <ToolArticle
          name="Database connection string builder"
          path="/tools/connection-string"
          description={metadata.description ?? ''}
          category="DeveloperApplication"
          sections={[
            {
              heading: 'Build a database connection string for Python',
              body: (
                <>
                  <p>
                    Select your database, then enter the host, port, database
                    name, and credentials. Copy the format that matches your
                    Python driver. PostgreSQL offers psycopg2 and SQLAlchemy
                    formats, MySQL offers SQLAlchemy with PyMySQL, MongoDB
                    offers PyMongo, and Redis offers redis-py.
                  </p>
                  <p>
                    For a local PostgreSQL example, the SQLAlchemy URL is{' '}
                    <code>
                      postgresql+psycopg2://postgres:example@localhost:5432/mydb
                    </code>
                    . Replace the example credentials and install the driver
                    named in the URL before using it in your application.
                  </p>
                  <p>
                    The builder formats text locally. It does not connect to
                    your database or test the credentials. Check the generated
                    TLS options against your database provider's requirements.
                  </p>
                </>
              ),
            },
            {
              heading: 'Looking for a string builder in Python?',
              body: (
                <>
                  <p>
                    For general text construction, Python has{' '}
                    <code>str.join</code> to combine string fragments and
                    f-strings to insert values. For example,{' '}
                    <code>{'"".join(["Hello", " ", "world"])'}</code> returns{' '}
                    <code>Hello world</code>. The{' '}
                    <a
                      className="underline"
                      href="https://docs.python.org/3/library/stdtypes.html#str.join"
                    >
                      Python string documentation
                    </a>{' '}
                    explains how joining strings works.
                  </p>
                  <p>
                    For database URLs, use the driver-specific formats above.
                    The URI outputs escape common password characters such as{' '}
                    <code>@</code> and <code>:</code>. Other formats have
                    different quoting rules, so review values that contain
                    spaces or quotes.
                  </p>
                </>
              ),
            },
          ]}
          faq={[
            {
              question: 'Which Python databases does the builder support?',
              answer:
                'It produces connection formats for PostgreSQL, MySQL, MongoDB, and Redis. The available Python formats depend on the selected database.',
            },
            {
              question: 'Does this tool test a database connection?',
              answer:
                'No. It generates connection strings in your browser. Test the copied configuration with the database driver in your own application.',
            },
          ]}
        />
      }
    />
  );
}
